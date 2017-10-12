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

let ycbcr2rgb = {
  'title':'ycbcr2rgb',
  'description': 'Convert YCbCr 420P source to RGB',
  'vertexShader' : '\
    attribute vec2 a_position;\
    attribute vec2 a_texCoord;\
    attribute vec2 a_chrCoord;\
    varying vec2 v_texCoord;\
    varying vec2 v_chrCoord;\
    void main() {\
      gl_Position = vec4(vec2(2.0,2.0)*a_position-vec2(1.0, 1.0), 0.0, 1.0);\
      v_texCoord = a_texCoord;\
      v_chrCoord = a_chrCoord;\
    }',
  'fragmentShader' : '\
    precision mediump float;\
    uniform sampler2D u_imageY;\
    uniform sampler2D u_imageCb;\
    uniform sampler2D u_imageCr;\
    uniform mat4 colMatrix;\
    varying vec2 v_texCoord;\
    varying vec2 v_chrCoord;\
    void main(){\
      float fY = texture2D(u_imageY, v_texCoord).x;\
      float fCb = texture2D(u_imageCb, v_chrCoord).x;\
      float fCr = texture2D(u_imageCr, v_chrCoord).x;\
      gl_FragColor = vec4(fY, fCb, fCr, 1.0) * colMatrix;\
    }',
  'properties' : {
    'colMatrix':{'type':'uniform', 'value':[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0]}
  },
  'inputs' : ['u_imageY', 'u_imageCb', 'u_imageCr']
};

module.exports = ycbcr2rgb;
