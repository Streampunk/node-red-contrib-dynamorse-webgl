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
  this.srcFlow = null;
  var dstFlow = null;
  var webGLeffect = Object.create(effect);

  if (!this.context().global.get('updated'))
    return this.log('Waiting for global context updated.');

  var nodeAPI = this.context().global.get('nodeAPI');
  var ledger = this.context().global.get('ledger');
  var localName = config.name || `${config.type}-${config.id}`;
  var localDescription = config.description || `${config.type}-${config.id}`;
  var pipelinesID = config.device ?
    RED.nodes.getNode(config.device).nmos_id :
    this.context().global.get('pipelinesID');

  var source = new ledger.Source(null, null, localName, localDescription,
    ledger.formats.video, null, null, pipelinesID, null);

  function processGrain(x, push, next) {
    var time = process.hrtime();
    result = webGLeffect.process(x.buffers[0]);
    var err = null;
    if (err) {
      push(err);
    } else if (result) {
      var diff = process.hrtime(time);
      console.log(`Process took ${(diff[0] * 1e9 + diff[1])/1e6} milliseconds`);
      push(null, new Grain(result, x.ptpSync, x.ptpOrigin,
                           x.timecode, dstFlow.id, source.id, x.duration));
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
      if (!this.srcFlow) {
        this.getNMOSFlow(x, (err, f) => {
          if (err) return push("Failed to resolve NMOS flow.");
          this.srcFlow = f;

          var dstTags = JSON.parse(JSON.stringify(this.srcFlow.tags));
          dstTags["packing"] = [ "RGBA8" ];
          dstTags["sampling"] = [ "RGBA-4:4:4:4" ];

          var formattedDstTags = JSON.stringify(dstTags, null, 2);
          RED.comms.publish('debug', {
            format: "WebGLValve output flow tags:",
            msg: formattedDstTags
          }, true);

          dstFlow = new ledger.Flow(null, null, localName, localDescription,
            ledger.formats.video, dstTags, source.id, null);

          nodeAPI.putResource(source).catch(err => {
            push(`Unable to register source: ${err}`);
          });
          nodeAPI.putResource(dstFlow).then(() => {
            let sampling = this.srcFlow.tags["sampling"][0]||"YCbCr-4:2:0";
            let colorimetry = this.srcFlow.tags["colorimetry"][0]||"BT709-2";
            webGLeffect.setup(
              +dstTags["width"][0]||1920, 
              +dstTags["height"][0]||1080, 
              sampling, colorimetry,
              this.shader, this.properties);
            processGrain(x, push, next);
          }, err => {
            push(`Unable to register flow: ${err}`);
          });
        });
      } else {
        processGrain(x, push, next);
      }
    } else {
      push(null, x);
      next();
    }
  });

  this.on('close', this.close);
}
util.inherits(WebGLValve, redioactive.Valve);

module.exports = {
  WebGLValve: WebGLValve
}
