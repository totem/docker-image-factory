/*!
 * Docker Image Factory - Notification module
 *
 */

'use strict';

var winston = require('winston'),
    Slack = require('node-slack'),
    nunjucks = require('nunjucks');

module.exports = SlackNotifier;

function SlackNotifier(cfg, slack) {
  this.cfg = cfg || {};
  this.slack = new Slack(cfg.url);
}

/**
 * Returns true if notification is enabled.
 * @returns {boolean}
 */
SlackNotifier.prototype.isEnabled = function () {
  return (this.cfg.url) ? true : false;
};

SlackNotifier.prototype.notify = function (isSuccessful, context) {
  var _this = this;
  var cfg = _this.cfg;
  if (_this.isEnabled()) {
    if (!isSuccessful) {

      // The owner of the repo
      var ownerUrl = ctx.owner;
      if(ctx.github) {
        ownerUrl = "https://github.com/" + ctx.owner;
      }

      // The repo
      var repoUrl = ctx.repo;
      if(ctx.github) {
        repoUrl = "https://github.com/" + ctx.owner + "/" + ctx.repo;
      }

      // The branch
      var branchUrl = ctx.ref;
      if(ctx.github) {
        branchUrl = "https://github.com/" + "/" + ctx.owner + "/" + ctx.repo + "/tree/" + ctx.ref;
      }

      // The commit
      var commitUrl = ctx.commit;
      if(ctx.github) {
        commitUrl = "https://github.com/" + ctx.owner + "/" + ctx.repo + "/commit/" + ctx.commit;
      }
      var shortCommit = ctx.commit

      // The job
      var jobUrl = ctx.baseUrl + "/job/" + ctx.id;
      var jobLogUrl = jobUrl + "/log";

      var channels = cfg.rooms.split(',');
      channels.forEach(function(channel) {
        _this.slack.send({
          text: " ",
          username: "Totem Bot",
          channel: channel,
          attachments: [{
            title: "Image Factory ( " + ctx.env + " )",
            text: link(ownerUrl, ctx.owner) + " / " + link(repoUrl, ctx.repo) + " / " + link(branchUrl, ctx.ref) + " / " + link(commitUrl, ctx.commit.substr(0, 7)),
            color: "danger",

            fields: [
              {
                title: "Job",
                value: link(jobUrl, ctx.id) + " ( " + link(jobLogUrl, "logs") + " )",
                short: true
              },
              {
                title: "Message",
                value: message,
                short: true
              }
            ],

            footer: "Image Factory",
            ts: Date.now() / 1000
          }]
        });
      });
    }
  }
};

function link(url, text) {
  return "<" + url + "|" + text + ">";
}
