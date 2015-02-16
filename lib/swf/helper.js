/*!
 * Provides  helper functions for swf
 */
'use strict';

var AWS = require('aws-sdk'),
  _ = require('lodash');


module.exports = {
  wrapConfigWithDefaultParameters: wrapConfigWithDefaultParameters,
  createClient: createClient
};

function wrapConfigWithDefaultParameters(swfConfig) {
  return  _.defaults(swfConfig, {
    defaultDomain: process.env.AWS_SWF_DOMAIN || 'totem-local',
    httpOptions: {
      timeout: 70000 // Long poll is 60, so 70 should catch problems
    },
    sslEnabled: true
  });
}

function createClient(swfConfig) {
  AWS.config.update(swfConfig);
  var swfClient = new AWS.SimpleWorkflow();
  return swfClient;
}



