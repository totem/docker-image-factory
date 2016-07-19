/*!
 * Docker Image Factory - Notification module
 *
 */

'use strict';

var winston = require('winston'),
    Slack = require('node-slack'),
    nunjucks = require('nunjucks');

module.exports = SlackNotifier;

function SlackNotifier(cfg) {
  this.cfg = cfg || {};
  this.slack = new Slack(cfg.url);
}

/**
 * Returns true if notification is enabled
 */
SlackNotifier.prototype.isEnabled = function () {
  return (this.cfg.url) ? true : false;
};

SlackNotifier.prototype.notify = function (isSuccessful, ctx) {
  var cfg = this.cfg;
  if (this.isEnabled() && !isSuccessful) {
    var channel = cfg.room;
    this.sendMessage('slack.json', ctx, channel);
  }
};

/**
 * Creates the context object to send the
 * template engine and then renders the template
 */
SlackNotifier.prototype.sendMessage = function(templateName, ctx, channel) {
  var _this = this;
  winston.debug('Posting slack message to ' + channel + ' channel');

  // Context object with any addition notification details
  var obj = {
    ctx: ctx,
    notification: {
      channel: channel,
      date: Date.now() / 1000
    }
  };
  
  // Render the template and send the message
  nunjucks.render(templateName, obj, function(err, resp) {
    if(!err) {
      _this.slack.send(JSON.parse(resp));
    } else {
      winston.error('Failed to render template. Reason: ' + err.message);
    }
  });
};
