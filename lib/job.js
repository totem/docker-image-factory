/*!
 * Docker Image Factory - Build Job
 * Copyright(c) 2013 Meltmedia
 * By Mike Moulton <mike@meltmedia.com>
 * Apache 2 Licensed
 */

'use strict';

var os = require('os'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    events = require('events'),
    async = require('async'),
    wrench = require('wrench'),
    shortId = require('shortid'),
    _ = require('lodash'),
    formatter = require('formatter'),
    constants = require('./constants'),
    helpers = require('./util');


// Export the JobRunner class
module.exports = JobRunner;

/*
 * # Job Runner
 * Responsible for managing the environment around running jobs and for starting new jobs following the configured steps
 *
 * * config: 
 * ```
 * {
 *   "tasks": {
 *     "your-step-name": {
 *       "cmd": "/your/command/to/execute",
 *       "timeout": "timeout in milliseconds" 
 *     }
 *     ...
 *   }
 * }
 * ```
 */
function JobRunner(config) {
  if (!_.isObject(config) || !_.isObject(config.tasks) || _.size(config.tasks) < 1) {
    throw new Error('You must provided at least on task to execute for Jobs created by this runner');
  }

  this.config = config;
  this.tasks = this.config.tasks;

  return this;
}

/*
 * # Create a new Job
 */
JobRunner.prototype.newJob = function newJob(context) {
  return new Job(this.tasks, context);
};


/*
 * # A Build Job
 *
 * * tasks: 
 * ```
 * {
 *   "tasks": {
 *     "your-step-name": {
 *       "cmd": "/your/command/to/execute",
 *       "timeout": "timeout in milliseconds" 
 *     }
 *     ...
 *   }
 * }
 * ```
 *
 * * context: 
 * ```
 * {
 *   "context": {
 *     "param-1": "value-1",
 *     "param-2": "value-2"
 *     ...
 *   }
 * }
 * ```
 */
function Job(tasks, context, heartbeatInterval) {
  if (!_.isObject(tasks) || _.size(tasks) < 1) {
    throw new Error('You must provided at least on task to execute');
  }

  events.EventEmitter.call(this);

  // The tasks this job is supposed to execute
  this.tasks = tasks;

  // The context for executing the tasks
  this.context = context || {};

  this.heartbeatInterval = heartbeatInterval || 10000;

  // Unique ID of Job
  this.id = shortId.generate();

  // Timing
  this.startTime = null;
  this.endTime = null;

  // Job Status
  this.status = constants.EVENTS.STATUS_PENDING;
  this.duplicate = false;
  this.emit(this.status);

  this.responses = [];

  // Job Results
  this.results = {};

}

// Ensure we can emit events
util.inherits(Job, events.EventEmitter);

/*
 * # Start the Job
 */
Job.prototype.start = function start(cb) {
  var _this = this;

  // Callback is optional
  cb = cb || function () {};

  this.startTime = new Date();

  this.status = constants.EVENTS.STATUS_RUNNING;

  _this.emit(this.status);

  // Start building the image
  this._executeJob(function (err) {

    _this.endTime = new Date();
    _this.status = (err) ? constants.EVENTS.STATUS_FAILURE : constants.EVENTS.STATUS_SUCCESS;

    _this.emit(_this.status);

    // Notify if we were given a callback
    cb(err);

  });
};


/*
 * # Execute the Job
 */
Job.prototype._executeJob = function _executeJob(cb) {

  var _this = this,
      tmpDir = os.tmpdir(),
      executionDir = path.join(tmpDir, this.id);

  this.log = path.join(tmpDir, '/' + this.id + '.log');


  function generateTasksForJob() {
    var generatedTasks = {};

    _.forEach(_this.tasks, function (value, key) {

      // Setup job to receive results of this task
      _this.results[key] = { status: constants.EVENTS.STATUS_PENDING };

      generatedTasks[key] = function (callback) {

        // Variable replace the command using values from the job's context
        var formattedCmd = formatter(value.cmd)(_this.context);
        var maxRetries = value.retries || 0; // max retries
        var retryWait = value.retryWait || 20000; //wait time in ms between retries

        _this.results[key].status = constants.EVENTS.STATUS_RUNNING;

        var heartbeatTimer = setInterval(function () {
          _this.emit(constants.EVENTS.HEARTBEAT_EVENT);
        }, _this.heartbeatInterval);

        /**
         * Function that executes the command and handles retries. If attempt >= max retries for
         * the job, it executes callback function else, retries the execution of command.
         * @param attempt integer representing the current attempt no. for command execution.
         */
        function execCmd(attempt) {
          helpers.execute(formattedCmd, { cwd: executionDir, timeout: value.timeout }, _this.log, function (err, code, signal) {
            // Update this steps results
            _this.emit(constants.EVENTS.HEARTBEAT_EVENT);
            clearInterval(heartbeatTimer);
            _this.results[key].status = (err) ? constants.EVENTS.STATUS_FAILURE : constants.EVENTS.STATUS_SUCCESS;
            _this.results[key].exitCode = code;
            _this.results[key].killSignal = signal;
            if (err) {
              _this.results[key].err = err;
            }
            if (!err || attempt >= maxRetries) {
              callback(err);
            }
            else {
              setTimeout(function () {
                execCmd(++attempt);
              }, retryWait);

            }

          });
        }
        if(_this.status === constants.EVENTS.STATUS_DUPLICATE) {
          callback();
        } else {
          execCmd(1);
        }
      };
    });

    return generatedTasks;
  }

  var jobTasks = generateTasksForJob();

  // Ensure that the execution directory exists
  fs.mkdirSync(executionDir);

  async.series(jobTasks, function (err) {
    // cleanup checkout working directory
    wrench.rmdirSyncRecursive(executionDir);

    cb(err);
  });
};
