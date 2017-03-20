/* Copyright 2016 Streampunk Media Ltd.

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
'use strict';
var webglProcess = require('./webglProcess.js').webglProcess;
var convert = require('./convert.js');

var effect = Object.create(webglProcess);

effect.setup = function (width, height, srcSampling, shader, properties) {
  this._gl = require('gl')(width, height, { preserveDrawingBuffer: true });
  let gl = this._gl;

  // set up for convert to rgb if required
  convert.setup(gl, width, height, srcSampling);

  this.init(gl, width, height, shader, properties);
}

effect.process = function (buf) {
  let gl = this._gl;
  let srcTextures = [];
  srcTextures.push(convert.convert(gl, buf));
  this.render (gl, srcTextures);

  this.time = process.hrtime();
  let pixels = new Uint8Array(this.width * this.height * 4);
  gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let diff = process.hrtime(this.time);
  console.log(`Result download took ${(diff[0] * 1e9 + diff[1])/1e6} milliseconds`);

  // for(var i=0; i<8192; i+=4) {
  //   process.stdout.write('(' + pixels[i] + ',' + pixels[i+1] + ',' + pixels[i+2] + '), ');
  // }
  // process.stdout.write('\n');

  return Buffer.from(pixels.buffer);
}

module.exports = effect;
