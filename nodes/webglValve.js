/* Copyright 2017 Streampunk Media Ltd.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var util = require('util');
var redioactive = require('node-red-contrib-dynamorse-core').Redioactive;
var Grain = require('node-red-contrib-dynamorse-core').Grain;
var effect = require('../src/effect.js');

function WebGLValve (RED, config) {
  redioactive.Valve.call(this, config);

  const node = this;
  let srcTags = null;
  let flowID = null;
  let sourceID = null;
  var webGLeffect = Object.create(effect);

  function processGrain(x, push, next) {
    var time = process.hrtime();
    const result = webGLeffect.process(x.buffers[0]);
    var err = null;
    if (err) {
      push(err);
    } else if (result) {
      var diff = process.hrtime(time);
      node.log(`Process took ${(diff[0] * 1e9 + diff[1])/1e6} milliseconds`);
      push(null, new Grain(result, x.ptpSync, x.ptpOrigin,
        x.timecode, flowID, sourceID, x.duration));
    }
    next();
  }

  this.consume((err, x, push, next) => {
    if (err) {
      push(err);
      next();
    } else if (redioactive.isEnd(x)) {
      push(null, x);
    } else if (Grain.isGrain(x)) {
      const nextJob = (srcTags) ?
        Promise.resolve(x) :
        this.findCable(x).then(cable => {
          if (!Array.isArray(cable[0].video) && cable[0].video.length < 1) {
            return Promise.reject('Logical cable does not contain video');
          }
          srcTags = cable[0].video[0].tags;
          const dstTags = JSON.parse(JSON.stringify(srcTags));
          dstTags.packing = 'RGBA8';
          dstTags.sampling = 'RGBA-4:4:4:4';
          const formattedDstTags = JSON.stringify(dstTags, null, 2);
          RED.comms.publish('debug', {
            format: `${config.type} output flow tags:`,
            msg: formattedDstTags
          }, true);

          this.makeCable({ video : [{ tags : dstTags }], backPressure : 'video[0]' });
          flowID = this.flowID();
          sourceID = this.sourceID();

          const sampling = srcTags.sampling||'YCbCr-4:2:0';
          const colorimetry = srcTags.colorimetry||'BT709-2';
          webGLeffect.setup(
            dstTags.width||1920, 
            dstTags.height||1080, 
            sampling, colorimetry,
            this.shader, this.properties);
        });

      nextJob.then(() => {
        processGrain(x, push, next);
      }).catch(err => {
        push(err);
        next();
      });  
    } else {
      push(null, x);
      next();
    }
  });

  this.on('close', () => {});
}
util.inherits(WebGLValve, redioactive.Valve);

module.exports = {
  WebGLValve: WebGLValve
};
