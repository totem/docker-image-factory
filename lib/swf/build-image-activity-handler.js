/*!
 * Handles build image activity type.
 */
'use strict';

var winston = require('winston'),
  constants = require('../constants');

module.exports = BuildImageActivityHandler;

/**
 * Activity handler for build image task.
 * @param jobFactory {Factory} instance for creating new jobs.
 * @constructor
 */
function BuildImageActivityHandler(jobFactory) {
  this.jobFactory = jobFactory;
}

/**
 *
 * @param task {ActivityTask} instance
 */
BuildImageActivityHandler.prototype.handle = function (task) {
  var context = JSON.parse(task.config.input);
  if (context instanceof Array) {
    context = context[0];
  }
  var jobFactory = this.jobFactory;
  jobFactory.newJobWithDefaults(context, function onSuccess(job) {
      //Image job succeeded
      job.on(constants.EVENTS.STATUS_SUCCESS, function () {
        task.respondCompleted(jobFactory.toPublicJob(job), function (err) {
          if (err) {
            winston.log('error', 'Failed to respondCompleted', err);
          }
        });
      });

      //Report heartbeat event.
      job.on(constants.EVENTS.HEARTBEAT_EVENT, function () {
        task.recordHeartbeat(job.results, function (err) {
          if (err) {
            winston.log('error', 'Failed to recordHeartbeat', err);
          }
        });
      });

      //Image job failed
      job.on(constants.EVENTS.STATUS_FAILURE, function () {
        var details = {
          retryable: true,
          message: 'Image job failed',
          name: 'IMAGE_JOB_FAILED',
          record: jobFactory.toPublicJob(job)
        };
        task.respondFailed(details.message, details, function (err) {
          if (err) {
            winston.log('error', 'Failed to record activity failure', err);
          }
        });
      });
    },
    function onError(code, message) {
      var details = {
        retryable: false,
        message: message,
        name: code
      };
      task.respondFailed(details.message, details, function (err) {
        if (err) {
          winston.log('error', 'Failed to record activity failure', err);
        }
      });
    });
};

