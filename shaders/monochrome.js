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

let monochrome = {
  'title':'Monochrome',
  'description': 'Change images to a single chroma (e.g can be used to make a black & white filter). Input color mix and output color mix can be adjusted.',
  'vertexShader' : '\
    attribute vec2 a_position;\
    attribute vec2 a_texCoord;\
    varying vec2 v_texCoord;\
    void main() {\
      gl_Position = vec4(vec2(2.0,2.0)*a_position-vec2(1.0, 1.0), 0.0, 1.0);\
      v_texCoord = a_texCoord;\
    }',
  'fragmentShader' : '\
    precision mediump float;\
    uniform sampler2D u_image;\
    uniform vec3 inputMix;\
    uniform vec3 outputMix;\
    varying vec2 v_texCoord;\
    void main(){\
      vec4 color = texture2D(u_image, v_texCoord);\
      float mono = color[0]*inputMix[0] + color[1]*inputMix[1] + color[2]*inputMix[2];\
      color[0] = mono * outputMix[0];\
      color[1] = mono * outputMix[1];\
      color[2] = mono * outputMix[2];\
      gl_FragColor = color;\
    }',
  'properties' : {
    'inputMix':{'type':'uniform', 'value':[0.4,0.6,0.2]},
    'outputMix':{'type':'uniform', 'value':[1.0,1.0,1.0]}
  },
  'inputs' : ['u_image']
};

module.exports = monochrome;
