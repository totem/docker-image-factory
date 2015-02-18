/*!
 * Docker Image Factory - Post Hook helper.
 */

'use strict';

var winston = require('winston'),
    crypto = require('crypto'),
    util = require('util'),
    request = require('request');

module.exports = PostHookNotifier;

/**
 * Activity handler for build image task.
 * @param jobFactory {Factory} instance for creating new jobs.
 * @constructor
 */
function PostHookNotifier(hookConfig) {
  this.hookConfig = hookConfig;
}

/**
 * Returns true if notification is enabled.
 * @returns {boolean}
 */
PostHookNotifier.prototype.isEnabled = function () {
  return this.hookConfig.postUrl ? true: false;
};

/**
 * Creates signature to be used for authorizing request.
 * @param data: Text payload to be sent.
 * @returns {*}
 */
PostHookNotifier.prototype.signRequest = function (data) {
  return crypto.createHmac('sha1', this.hookConfig.secret).update(data).digest('hex');
};

/**
 * Notifies using http post.
 * @param isSuccessful boolean value specifying if image build succeeded or failed.
 * @param context Job context used for creating image
 * @param image image registry path.
 */
PostHookNotifier.prototype.notify = function (isSuccessful, context, image) {
  var _this = this;
  if (_this.isEnabled()) {
    var payload = {
      git: {
        owner: context.owner,
        repo: context.repo,
        ref: context.branch,
        commit: context.commit
      },
      type: 'builder',
      name: 'image-factory',
      status: (isSuccessful ? 'success' : 'failed'),
      result: {
        image: image
      }
    };
    winston.info('Executing posthook: ' + _this.hookConfig.postUrl + ' for payload',
        util.inspect(payload));
    var txt = JSON.stringify(payload);
    var signature = _this.signRequest(txt);
    request.post(
       _this.hookConfig.postUrl,
      {
        body: txt,
        headers: {
          'Content-Type': 'application/json',
          'X-Hook-Signature': signature
        }
      },
      function (err, response, body) {
        if (err) {
          winston.error('Error executing posthook: ' + _this.hookConfig.postUrl + ': ' +
              util.inspect(err));
        }
        else if (response.statusCode >= 400 || response < 200) {
          winston.error('Got response code: ' + response.statusCode + ' while executing posthook: ' +
              _this.hookConfig.postUrl + '. Response: ' + body);
        }
        else {
          winston.info('Successfully notified: ' + _this.hookConfig.postUrl);
        }
      }
    );
  }
};

