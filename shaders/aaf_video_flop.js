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

let aaf_video_flop = {
    "title":"AAF Video Flop Effect",
    "description": "A flop effect based on the AAF spec. Mirrors the image in the y-axis",
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
            varying vec2 v_texCoord;\
            void main(){\
                vec2 coord = vec2(1.0 - v_texCoord[0] ,v_texCoord[1]);\
                vec4 color = texture2D(u_image, coord);\
                gl_FragColor = color;\
            }",
    "properties":{
    },
    "inputs":["u_image"]
};

module.exports = aaf_video_flop;