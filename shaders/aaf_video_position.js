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

let aaf_video_position = {
    "title":"AAF Video Position Effect",
    "description": "A position effect based on the AAF spec.",
    "vertexShader" : "\
        attribute vec2 a_position;\
        attribute vec2 a_texCoord;\
        varying vec2 v_texCoord;\
        void main() {\
            gl_Position = vec4(vec2(2.0,2.0)*a_position-vec2(1.0, 1.0), 0.0, 1.0);\
            v_texCoord = a_texCoord;\
        }",
    "fragmentShader" : "\
        precision mediump float;\
        uniform sampler2D u_image;\
        uniform float positionOffsetX;\
        uniform float positionOffsetY;\
        varying vec2 v_texCoord;\
        varying float v_progress;\
        void main(){\
            vec2 pos = vec2(v_texCoord[0] - positionOffsetX/2.0, v_texCoord[1] -  positionOffsetY/2.0);\
            vec4 color = texture2D(u_image, pos);\
            if (pos[0] < 0.0 || pos[0] > 1.0 || pos[1] < 0.0 || pos[1] > 1.0){\
                color = vec4(0.0,0.0,0.0,0.0);\
            }\
            gl_FragColor = color;\
        }",
    "properties":{
        "positionOffsetX":{"type":"uniform", "value":0.0},
        "positionOffsetY":{"type":"uniform", "value":0.0}
    },
    "inputs":["u_image"]
};

module.exports = aaf_video_position;