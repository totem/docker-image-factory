'use strict';

var swf = require('aws-swf'),
  winston = require('winston'),
  shortId = require('shortid'),
  _s = require('underscore.string'),
  backoff = require('backoff'),
  BuildImageActivityHandler = require('./build-image-activity-handler'),
  constants = require('../constants');

module.exports = ImageFactoryActivities;

/**
 * SWF Activities for Image Factory.
 * @param swfClient SWF Client instance
 * @param domain {String} representing SWF Domain.
 * @param jobFactory {Factory} instance
 * @param identity Identifier for the poller
 * @param taskListName Tasklist name for the the poller.
 * @param activityPoller Activity poller instance. (Added for mocking during UT).
 * @param buildImageActivityHandler {BuildImageActivityHandler} instance for handling building of image.
 * @param pollerBackoff Backoff poller for providing a backoff timer to restart activityPoller when it fails.
 * @constructor
 */
function ImageFactoryActivities(swfClient, domain, jobFactory, identity, taskListName, activityPoller,
                                buildImageActivityHandler, pollerBackoff) {

  /**
   * Activity poller.
   * @type {*|exports.ActivityPoller}
   */
  activityPoller = activityPoller || new swf.ActivityPoller({
    'domain': domain,
    'taskList': {'name': taskListName || constants.SWF.DEFAULT_TASK_LIST},
    'identity': identity || shortId.generate()
  }, swfClient);

  buildImageActivityHandler = buildImageActivityHandler || new BuildImageActivityHandler(jobFactory);

  /**
   * Creates a default instance of backoff poller using fibbonacci sequence.
   */
  pollerBackoff = pollerBackoff || backoff.fibonacci({
    randomisationFactor: 0,
    initialDelay: 10,
    maxDelay: 30000
  });

  /**
   * Handle the backoff event.
   */
  pollerBackoff.on('backoff', function (number, delay) {
    winston.log('warn', 'Workflow poller failed %d time(s), restarting in %d ms', number, delay, {});
  });

  /**
   * Handles the ready event after backoff.
   */
  pollerBackoff.on('ready', function () {
    winston.log('info', 'Restarting simple workflow poller');
    activityPoller.start();
  });

  /**
   * Activity poller failed too many times. Handle failure.
   */
  pollerBackoff.on('fail', function (number) {
    winston.log('error', 'Starting simple workflow poller failed too many times [%d], will not restart', number);
  });




  /**
   * Stops the polling.
   */
  this.stop = function () {
    activityPoller.stop();
  };

  /**
   * Starts the polling logic.
   */
  this.start = function () {
    activityPoller.start();
  };

  //Handle activity task event
  activityPoller.on('activityTask', function (task) {
    winston.log('debug', 'Received new activity task !');

    //Check for BUILD_IMAGE activity. In future , this might be broken down to multiple.
    if (task.config.activityType.name === constants.SWF.ACTIVITY_TYPES.BUILD_IMAGE.name) {
      buildImageActivityHandler.handle(task);
    }
    else {
      var details = {
        retryable: false,
        message: _s.sprintf('Unsupported Activity Type %s-%s', task.config.activityType.name,
          task.config.activityType.version),
        name: 'UNSUPPORTED_IMAGE_ACTIVITY'
      };
      task.respondFailed(details.message, details, function (err) {
        if (err) {
          winston.log('error', err);
          return;
        }
        winston.log('warn', 'Activity Execution failed. Reason: ' + details.message);
      });
    }
  });

  /**
   * Handle poll event.
   */
  activityPoller.on('poll', function (pollConfig) {
    winston.log('info', 'polling for image factory activites tasks...', pollConfig);
  });

  /**
   * Handles error during poller and restart the poller. Like network issues.
   */
  activityPoller.on('error', function (err) {
    winston.log('error', 'An error occured while polling for new activity tasks:', err);
    // Attempt to start polling again
    pollerBackoff.backoff();
  });

}

