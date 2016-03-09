/*!
 * Constants used by ImageFactory.
 */

'use strict';
module.exports = Object.freeze({
  EVENTS: {
    HEARTBEAT_EVENT: 'heartbeat',
    STATUS_PENDING: 'pending',
    STATUS_RUNNING: 'running',
    STATUS_SUCCESS: 'success',
    STATUS_FAILURE: 'failure',
    STATUS_DUPLICATE: 'duplicate'
  },

  SWF: {
    DEFAULT_TASK_LIST: 'build-image-list',
    ACTIVITY_TYPES: {
      BUILD_IMAGE: {
        name: 'BuildImageActivities.buildImage',
        version: '0.0.7'
      }
    },
    ACTIVITY_TIMEOUTS: {
      DEFAULT_TASK_START_TO_CLOSE: '3300',
      DEFAULT_TASK_SCHEDULE_TO_START: '7200',
      DEFAULT_HEARTBEAT_TIMEOUT: '120',
      DEFAULT_SCHEDULE_TO_CLOSE_TIMEOUT: '10800'
    }
  }
});