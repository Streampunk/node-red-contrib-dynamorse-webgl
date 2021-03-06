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

const util = require('util');
const shader = require('../shaders/verticalBlur.js');
const WebGLValve = require('./webglValve.js').WebGLValve;

module.exports = function (RED) {
  function VerticalBlur (config) {
    RED.nodes.createNode(this, config);
    WebGLValve.call(this, RED, config);

    this.shader = shader;
    this.properties = {
      blurAmount: +config.blur
    };
  }
  util.inherits(VerticalBlur, WebGLValve);
  RED.nodes.registerType('vertical-blur', VerticalBlur);
};
