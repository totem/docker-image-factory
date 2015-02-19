/*!
 * Docker Image Factory - Notification module
 *
 */

'use strict';

var winston = require('winston'),
    Hipchatter = require('hipchatter'),
    nunjucks = require('nunjucks');

module.exports = HipchatNotifier;

function HipchatNotifier(cfg, chatter) {
  this.chatter = chatter || new Hipchatter();
  this.cfg = cfg || {};
}

/**
 * Returns true if notification is enabled.
 * @returns {boolean}
 */
HipchatNotifier.prototype.isEnabled = function () {
  return (this.cfg.token && this.cfg.room) ? true : false;
};


HipchatNotifier.prototype.notify = function (isSuccessful, context) {
  var _this = this;
  var cfg = _this.cfg;
  if (_this.isEnabled()) {
    if (!isSuccessful) {
      nunjucks.render(
          'notification.html',
          {
            ctx: context,
            notification: {
              'code': 'IMAGE_BUILD_FAILED',
              'message': 'ImageFactory build failed.'
            }
          },
          function (err, msg) {
            if (err) {
              winston.error('Failed to render notification template. Reason: ' + err.message);
            } else {
                _this.chatter.notify(cfg.room,
                    {
                      message: msg,
                      color: 'red',
                      token: cfg.token,
                      notify: true,
                      message_format: 'html'
                    }, function (err) {
                      if (err) {
                        winston.error('Failed to send hipchat notification. Reason: ' + err.message);
                      }
                    }
                );
            }
          }
      );
    }
  }
};