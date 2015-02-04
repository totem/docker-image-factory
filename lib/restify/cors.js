/*jshint maxcomplexity:15 */

/*!
 * Docker Image Factory - Restify CORS Support
 * Modified from restify/lib/plugins/fullResponse.js
 * Original Copyright 2012 Mark Cavage, Inc.  All rights reserved.
 */

'use strict';

var crypto = require('crypto');

var ALLOW_HEADERS = [
  'Accept',
  'Accept-Version',
  'Content-Length',
  'Content-MD5',
  'Content-Type',
  'Date',
  'Api-Version',
  'Response-Time'
].join(', ');

var EXPOSE_HEADERS = [
  'Api-Version',
  'Request-Id',
  'Response-Time',
  'Content-Length',
  'Content-MD5',
  'Content-Type',
  'Date',
  'Link'
].join(', ');

module.exports = fullCORSResponse;

function setHeaders(req, res) {
  var hash;
  var now = new Date();
  var methods;

  if (!res.getHeader('Access-Control-Allow-Origin')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  if (!res.getHeader('Access-Control-Allow-Headers')) {
    res.setHeader('Access-Control-Allow-Headers', ALLOW_HEADERS);
  }

  if (!res.getHeader('Access-Control-Allow-Methods')) {
    if (res.methods && res.methods.length > 0) {
      methods = res.methods.join(', ');
      res.setHeader('Access-Control-Allow-Methods', methods);
    }
  }

  if (!res.getHeader('Access-Control-Expose-Headers')) {
    res.setHeader('Access-Control-Expose-Headers', EXPOSE_HEADERS);
  }

  if (!res.getHeader('Connection')) {
    res.setHeader('Connection', req.isKeepAlive() ? 'Keep-Alive' : 'close');
  }

  if (res._data && !res.getHeader('Content-MD5')) {
    hash = crypto.createHash('md5');
    hash.update(res._data);
    res.setHeader('Content-MD5', hash.digest('base64'));
  }

  if (!res.getHeader('Date')) {
    res.setHeader('Date', now.toUTCString());
  }

  if (res.etag && !res.getHeader('Etag')) {
    res.setHeader('Etag', res.etag);
  }

  if (!res.getHeader('Server')) {
    res.setHeader('Server', res.serverName);
  }

  if (res.version && !res.getHeader('Api-Version')) {
    res.setHeader('Api-Version', res.version);
  }

  if (!res.getHeader('Request-Id')) {
    res.setHeader('Request-Id', req.getId());
  }

  if (!res.getHeader('Response-Time')) {
    res.setHeader('Response-Time', now.getTime() - req._time);
  }
}

function fullCORSResponse() {
  function restifyResponseHeaders(req, res, next) {
    res.once('header', function () {
      // Restify 1.0 compatibility
      if (res.defaultResponseFormatters) {
        res.defaultResponseFormatters(res._data);
      }

      res.emit('beforeSend', res._data, res._body);

      // end backwards-compatibility
      return (setHeaders(req, res));
    });

    return (next());
  }

  return (restifyResponseHeaders);
}
