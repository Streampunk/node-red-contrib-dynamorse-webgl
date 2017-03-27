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

function compileShader(gl, shaderSource, shaderType) {
  let shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
  let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }
  return shader;
}

function createShaderProgram(gl, vertexShaderSource, fragmentShaderSource){
  let vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  let fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  let program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)){
    throw {"error":4,"msg":"Can't link shader program for track", toString:function(){return this.msg;}};
  }
  return program;
}

function createElementTexture(gl, buffer, width, height, fmt) {
  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR/*gl.NEAREST*/);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR/*gl.NEAREST*/);

  gl.texImage2D(gl.TEXTURE_2D, 0, fmt, width, height, 0, fmt, gl.UNSIGNED_BYTE, buffer);

  return texture;
}

var webglProcess = {
  init: function(gl, shader, properties) {
    this.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    this.program = createShaderProgram(gl, shader.vertexShader, shader.fragmentShader);

    this.properties = {};
    for (let propertyName in shader.properties) {
      let propertyValue = shader.properties[propertyName].value;
      //if an array then shallow copy it
      if (Object.prototype.toString.call(propertyValue) === "[object Array]") {
        propertyValue = shader.properties[propertyName].value.slice();
      }
      let propertyType = shader.properties[propertyName].type;
      this.properties[propertyName] = {type:propertyType, value:propertyValue};
    }

    // set properties
    for (let propertyName in properties)
      this.properties[propertyName].value = properties[propertyName];

    // find the locations of the properties in the compiled shader
    for (let propertyName in this.properties) {
      if (this.properties[propertyName].type === "uniform") {
        this.properties[propertyName].location = gl.getUniformLocation(this.program, propertyName);
      }
    }

    // calculate texture units for input textures
    this.inputTextureUnitMapping = [];
    let boundTextureUnits = 0;
    for (let inputName of shader.inputs) {
      this.inputTextureUnitMapping.push({
        name: inputName, 
        textureUnit: gl.TEXTURE0 + boundTextureUnits,
        location: gl.getUniformLocation(this.program, inputName)
      });
      boundTextureUnits += 1;
      if (boundTextureUnits > this.maxTextureUnits) {
        throw "Trying to bind more than available texture units to shader";
      }
    }

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    let positionLocation = gl.getAttribLocation(this.program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 0.0]),
      gl.STATIC_DRAW);
    let texCoordLocation = gl.getAttribLocation(this.program, "a_texCoord");
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
  },

  render: function(gl, srcTextures) {
    gl.useProgram(this.program);

    // upload the custom uniforms
    for (let propertyName in this.properties) {
      let propertyValue = this.properties[propertyName].value;
      let propertyType = this.properties[propertyName].type;
      let propertyLocation = this.properties[propertyName].location;
      if (propertyType !== "uniform") continue;

      if (typeof propertyValue === "number") {
        gl.uniform1f(propertyLocation, propertyValue);
      }
      else if (Object.prototype.toString.call(propertyValue) === "[object Array]") {
        if (propertyValue.length === 1) {
          gl.uniform1fv(propertyLocation, propertyValue);
        } else if(propertyValue.length === 2) {
          gl.uniform2fv(propertyLocation, propertyValue);
        } else if(propertyValue.length === 3) {
          gl.uniform3fv(propertyLocation, propertyValue);
        } else if(propertyValue.length === 4) {
          gl.uniform4fv(propertyLocation, propertyValue);
        } else if(propertyValue.length === 16) {
          gl.uniformMatrix4fv(propertyLocation, false, propertyValue);
        } else {
          console.debug("Shader parameter", propertyName, "is too long an array:", propertyValue);
        }
      }
    }

    let textureOffset = 0;
    for (var i = 0; i < this.inputTextureUnitMapping.length; i++) {
      let inputTexture = srcTextures[i];
      let textureUnit = this.inputTextureUnitMapping[i].textureUnit;
      let textureName = this.inputTextureUnitMapping[i].name;
      let textureLocation = this.inputTextureUnitMapping[i].location;

      gl.activeTexture(textureUnit);
      gl.uniform1i(textureLocation, textureOffset);
      textureOffset += 1;
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
};

module.exports = {
  webglProcess: webglProcess,
  createElementTexture: createElementTexture
}
