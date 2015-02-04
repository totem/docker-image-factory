/*!
 * Defines registrations of activities and workflows
 */
'use strict';

var constants = require('../constants');

exports.register = register;
/**
 *
 * @param domain {String} representing swf Domain
 * @param swfClient {Object} instance
 */
function register(domain, swfClient) {

  swfClient.client.registerActivityType({
    domain: domain,
    name: constants.SWF.ACTIVITY_TYPES.BUILD_IMAGE.name,
    description: 'Build Image activity',
    defaultTaskList: {'name': constants.SWF.DEFAULT_TASK_LIST},
    defaultTaskScheduleToStartTimeout: constants.SWF.ACTIVITY_TIMEOUTS.DEFAULT_TASK_SCHEDULE_TO_START,
    defaultTaskStartToCloseTimeout: constants.SWF.ACTIVITY_TIMEOUTS.DEFAULT_TASK_START_TO_CLOSE,
    defaultTaskHeartbeatTimeout: constants.SWF.ACTIVITY_TIMEOUTS.DEFAULT_HEARTBEAT_TIMEOUT,
    defaultTaskScheduleToCloseTimeout: constants.SWF.ACTIVITY_TIMEOUTS.DEFAULT_SCHEDULE_TO_CLOSE_TIMEOUT,
    version: constants.SWF.ACTIVITY_TYPES.BUILD_IMAGE.version
  }, function (err) {
    if (err !== null && err.code !== 'TypeAlreadyExistsFault') {
      throw err;
    }
  });

}