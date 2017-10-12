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

var http = require('http');

var properties = {
  redPort: 1880
};

function adminApiReq(method, path, payload, cb) {
  var req = http.request({
    host: 'localhost',
    port : properties.redPort,
    path : path,
    method : method,
    headers : {
      'Content-Type' : 'application/json',
      'Content-Length' : payload ? payload.length : 0
    }
  }, (res) => {
    var statusCode = res.statusCode;
    // var contentType = res.headers['content-type'];

    var reqOK = true;
    if (!((200 === statusCode) || (204 == statusCode))) {
      reqOK = false;
      console.log(`Problem with admin API '${method}' request to path '${path}': status ${statusCode}`);
    }

    res.setEncoding('utf8');
    var rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
      var response = (204 === statusCode)?null:JSON.parse(rawData);
      cb(reqOK?null:response, response);
    });
  }).on('error', (e) => {
    console.log(`Problem with admin API '${method}' request to path '${path}': ${e.message}`);
  });

  if (payload)
    req.write(payload);
  req.end();
}

var id = 0;
var demoNodes = {
  demoFlowTab: JSON.stringify({
    'id': id++,
    'label': 'Demo Flow',
    'nodes': []
  }),
  pcapReaderNode: JSON.stringify({
    'id': id++,
    'type': 'pcap-reader',
    'name': '',
    'file': '',
    'loop': false,
    'regenerate': false,
    'format': 'video',
    'description': '',
    'device': '',
    'sdpURL': '',
    'encodingName': 'raw',
    'clockRate': 90000,
    'sampling': 'YCbCr-4:2:2',
    'width': 1920,
    'height': 1080,
    'depth': 10,
    'colorimetry': 'BT709-2',
    'interlace': true,
    'packing': 'pgroup',
    'channels': 0,
    'bitrate': 0,
    'maxBuffer': 10,
    'wires': [[]]
  }),
  packerNode: JSON.stringify({
    'id': id++,
    'type': 'packer',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'dstFormat': '420P',
    'wires': [[]]
  }),
  monochromeNode: JSON.stringify({
    'id': id++,
    'type': 'monochrome',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'ipMixR': '0.4',
    'ipMixG': '0.6',
    'ipMixB': '0.2',
    'opMixR': '1.0',
    'opMixG': '1.0',
    'opMixB': '1.0',
    'wires': [[]]
  }),
  aafVideoCropNode: JSON.stringify({
    'id': id++,
    'type': 'aaf-video-crop',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'cropLeft': '-1.0',
    'cropRight': '1.0',
    'cropTop': '-1.0',
    'cropBottom': '1.0',
    'wires': [[]]
  }),
  aafVideoFlipNode: JSON.stringify({
    'id': id++,
    'type': 'aaf-video-flip',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'wires': [[]]
  }),
  aafVideoFlopNode: JSON.stringify({
    'id': id++,
    'type': 'aaf-video-flop',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'wires': [[]]
  }),
  aafVideoPositionNode: JSON.stringify({
    'id': id++,
    'type': 'aaf-video-position',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'offsetX': '0.0',
    'offsetY': '0.0',
    'wires': [[]]
  }),
  aafVideoScaleNode: JSON.stringify({
    'id': id++,
    'type': 'aaf-video-scale',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'scaleX': '1.0',
    'scaleY': '1.0',
    'wires': [[]]
  }),
  horizontalBlurNode: JSON.stringify({
    'id': id++,
    'type': 'horizontal-blur',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'blur': '1.0',
    'wires': [[]]
  }),
  verticalBlurNode: JSON.stringify({
    'id': id++,
    'type': 'vertical-blur',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'blur': '1.0',
    'wires': [[]]
  }),
  converterNode: JSON.stringify({
    'id': id++,
    'type': 'converter',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'dstWidth': '1920',
    'dstHeight': '1080',
    'dstFormat': '420P',
    'multiviewSetup': '',
    'wires': [[]]
  }),
  encoderNode: JSON.stringify({
    'id': id++,
    'type': 'encoder',
    'name': '',
    'maxBuffer': 10,
    'description': '',
    'device': '',
    'dstFormat': 'h264',
    'bitrate': 5000000,
    'gopFrames': 15,
    'wires': [[]]
  }),
  rawFileOutNode: JSON.stringify({
    'id': id++,
    'type': 'raw-file-out',
    'name': '',
    'file': 'C:\\Users\\simon\\Documents\\essence.h264',
    'headers': '',
    'timeout': 0,
    'wires': []
  })
};

var pipelineId = '';
var curDemoTabId = '';

const readTabs = function() {
  return new Promise((resolve, reject) => {
    adminApiReq('GET', '/flows', null, (err, res) => {
      if (err) return reject(err);

      for (let i=0; i<res.length; ++i) {
        if (res[i].nmos_type==='urn:x-nmos:device:pipeline') {
          pipelineId = res[i].id;
        }
        if ((res[i].type==='tab') && (res[i].label==='Demo Flow')) {
          curDemoTabId = res[i].id;
        }
      }
      resolve(res);
    });
  });
};

const clearDemoTab = function() {
  return new Promise((resolve, reject) => {
    if (curDemoTabId) {
      adminApiReq('DELETE', `/flow/${curDemoTabId}`, null, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    }
    else
      resolve();
  });
};

const createDemoTab = function() {
  return new Promise((resolve, reject) => {
    let demoFlow = JSON.parse(demoNodes.demoFlowTab);
    adminApiReq('POST', '/flow', JSON.stringify(demoFlow), (err, res) => {
      if (err) return reject(err);
      curDemoTabId = res.id;
      resolve(res);
    });
  });
};

const deployNodes = function() {
  return new Promise((resolve, reject) => {
    let demoFlow = JSON.parse(demoNodes.demoFlowTab);
    var n = 0;    
    demoFlow.nodes[n] = JSON.parse(demoNodes.pcapReaderNode);
    demoFlow.nodes[n].file = 'C:\\Users\\simon\\Documents\\Streampunk\\Media\\rtp-video-rfc4175-1080i50-sync.pcap';
    demoFlow.nodes[n].sdpURL = 'file:C:\\Users\\simon\\OneDrive\\Streampunk\\nmi-examples\\sdp_rfc4175_10bit_1080i50.sdp';
    ++n;
    demoFlow.nodes[n] = JSON.parse(demoNodes.packerNode);
    ++n;
    // demoFlow.nodes[n] = JSON.parse(demoNodes.monochromeNode);
    // ++n;
    // demoFlow.nodes[n] = JSON.parse(demoNodes.aafVideoCropNode);
    // demoFlow.nodes[n].cropLeft = "-1.0",
    // demoFlow.nodes[n].cropRight = "1.0",
    // demoFlow.nodes[n].cropTop = "-1.0",
    // demoFlow.nodes[n].cropBottom = "1.0",
    // ++n;
    // demoFlow.nodes[n] = JSON.parse(demoNodes.aafVideoFlipNode);
    // ++n;
    demoFlow.nodes[n] = JSON.parse(demoNodes.aafVideoFlopNode);
    ++n;
    // demoFlow.nodes[n] = JSON.parse(demoNodes.aafVideoPositionNode);
    // demoFlow.nodes[n].offsetX = "0.0",
    // demoFlow.nodes[n].offsetY = "0.0",
    // ++n;
    // demoFlow.nodes[n] = JSON.parse(demoNodes.aafVideoScaleNode);
    // demoFlow.nodes[n].scaleX = "1.0",
    // demoFlow.nodes[n].scaleY = "1.0",
    // ++n;
    demoFlow.nodes[n] = JSON.parse(demoNodes.horizontalBlurNode);
    demoFlow.nodes[n].blur = 0.5;
    ++n;
    // demoFlow.nodes[n] = JSON.parse(demoNodes.verticalBlurNode);
    // demoFlow.nodes[n].blur = 0.5;
    // ++n;
    demoFlow.nodes[n] = JSON.parse(demoNodes.converterNode);
    ++n;
    demoFlow.nodes[n] = JSON.parse(demoNodes.encoderNode);
    ++n;
    demoFlow.nodes[n] = JSON.parse(demoNodes.rawFileOutNode);

    let lastId = '';
    for (let i=demoFlow.nodes.length-1; i>=0; --i) {
      demoFlow.nodes[i].id = i;

      if (lastId)
        demoFlow.nodes[i].wires[0][0] = lastId;
      lastId = demoFlow.nodes[i].id;
        
      if (demoFlow.nodes[i].hasOwnProperty('device')) 
        demoFlow.nodes[i].device = pipelineId;
  
      demoFlow.nodes[i].x = 200.0 * (i + 1);
      demoFlow.nodes[i].y = 300 - 50 * (i%2);
    }

    adminApiReq('PUT', `/flow/${curDemoTabId}`, JSON.stringify(demoFlow), (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
};

readTabs()
  .then(() => clearDemoTab())
  .then(() => createDemoTab())
  .then(() => deployNodes())
  .then(undefined, console.error);
