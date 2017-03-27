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
var createElementTexture = require('./webglProcess.js').createElementTexture;
var ycbcr2rgb = require('../shaders/ycbcr2rgb.js');

function ycbcr2rgbMatrix(colourspace) {
  // Assumes:
  //   All 8-bit
  //   Luma black-white is 16-235, Chroma min-max is 16-240.
  //   RGB is full range 0-255.
  var kR, kG, kB;
  switch (colourspace) {
    default:
    case '709':  // https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.709-6-201506-I!!PDF-E.pdf
      kR = 0.2126;
      kB = 0.0722;
      break;
    case '2020': // https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.2020-2-201510-I!!PDF-E.pdf
      kR = 0.2627;
      kB = 0.0593;
      break;
    case '601':  // https://www.itu.int/dms_pubrec/itu-r/rec/bt/R-REC-BT.601-7-201103-I!!PDF-E.pdf
      kR = 0.299;
      kB = 0.114;
      break;
  }
  kG = 1.0 - kR - kB;

  var Yr = 1.0 * 255.0 / 219.0;
  var Ur = 0.0;
  var Vr = (1.0 - kR) * 255.0 / 112.0;
  var Or = - (16.0 / 255.0 * Yr) - (128.0 / 255.0 * Ur) - (128.0 / 255.0 * Vr);

  var Yg = 1.0 * 255.0 / 219.0;
  var Ug = -(1.0 - kB) * kB / kG * 255.0 / 112.0;
  var Vg = -(1.0 - kR) * kR / kG * 255.0 / 112.0;
  var Og = - (16.0 / 255.0 * Yg) - (128.0 / 255.0 * Ug) - (128.0 / 255.0 * Vg);

  var Yb = 1.0 * 255.0 / 219.0;
  var Ub = (1.0 - kB) * 255.0 / 112.0;
  var Vb = 0.0;
  var Ob = - (16.0 / 255.0 * Yb) - (128.0 / 255.0 * Ub) - (128.0 / 255.0 * Vb);

  var matrix = [Yr, Ur, Vr, Or,
                Yg, Ug, Vg, Og,
                Yb, Ub, Vb, Ob,
                0.0, 0.0, 0.0, 1.0];
  
  return matrix;
}

var convert = Object.create(webglProcess);

convert.setup = function (gl, width, height, srcSampling, srcColorimetry) {
  this.width = width;
  this.height = height;
  this.sampling = srcSampling.slice(0, srcSampling.search('-'));
  this.colorimetry = srcColorimetry.slice(2, srcColorimetry.search('-'));
  this.srcIsYCbCr = ('YCbCr' === this.sampling);
  if (this.srcIsYCbCr) {
    this.texture = createElementTexture(gl, null, this.width, this.height, gl.RGBA);
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    let matrix = ycbcr2rgbMatrix(this.colorimetry);
    let properties = { colMatrix: matrix };
    this.init(gl, ycbcr2rgb, properties);
    let chrCoordLocation = gl.getAttribLocation(this.program, "a_chrCoord");
    gl.enableVertexAttribArray(chrCoordLocation);
    gl.vertexAttribPointer(chrCoordLocation, 2, gl.FLOAT, false, 0, 0);
  }
}

convert.convert = function (gl, buf) {
  let result = null;
  if (this.srcIsYCbCr) {
    this.time = process.hrtime();

    let lumLength = this.width * this.height;
    let chrLength = lumLength / 4;
    let offsetY = 0;
    let offsetCb = lumLength;
    let offsetCr = offsetCb + chrLength;
    let bufY = buf.slice(offsetY, offsetCb);
    let bufCb = buf.slice(offsetCb, offsetCr);
    let bufCr = buf.slice(offsetCr, offsetCr + chrLength);

    let srcTextures = [];
    srcTextures.push (createElementTexture(gl, bufY, this.width, this.height, gl.LUMINANCE));
    srcTextures.push (createElementTexture(gl, bufCb, this.width / 2, this.height / 2, gl.LUMINANCE));
    srcTextures.push (createElementTexture(gl, bufCr, this.width / 2, this.height / 2, gl.LUMINANCE));
    let diff = process.hrtime(this.time);
    console.log(`Convert upload took ${(diff[0] * 1e9 + diff[1])/1e6} milliseconds`);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    this.render (gl, srcTextures);
    result = this.texture;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  } else {
    this.time = process.hrtime();
    result = createElementTexture(gl, buf, this.width, this.height, gl.RGBA);
    let diff = process.hrtime(this.time);
    console.log(`Source upload took ${(diff[0] * 1e9 + diff[1])/1e6} milliseconds`);
  }

  return result;
}

module.exports = convert;
