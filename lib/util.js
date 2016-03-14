/*!
 * Docker Image Factory - Utilities
 * Copyright(c) 2013 Meltmedia
 * By Mike Moulton <mike@meltmedia.com>
 * Apache 2 Licensed
 */

'use strict';

var winston = require('winston'),
    fs = require('fs'),
    spawn = require('child_process').spawn;

/*
 * # Utilities
 */
module.exports = {

  /*
   * # Execution Helper
   * Executes command on underlying OS, handling all the event wiring, logs, error states, etc.
   */
  execute: function execute(command, options, logFile, callback) {

    var commandParts = ['/bin/bash', '-c', command],
        cmd = commandParts[0],
        args = commandParts.slice(1),
        start = new Date(),
        error = null,
        timeoutInterval = null;

    // Open the log for appending
    var log = fs.createWriteStream(logFile, { flags: 'a' });

    function wrapUp(err, code, signal) {
      var msg;

      if (err) {
        msg = 'Command ' + command + ' terminated unexpectedly with the following error: ' + err.message;
        winston.log('warn', msg);
      } else if (code > 0) {
        msg = 'Command ' + command + ' exited with a non-zero exit code: ' + code;
        err = new Error(msg);
      } else if (signal) {
        msg = 'Command ' + command + ' was prematuraly terminated by parent with signal: ' + signal;
        err = new Error(msg);
      } else {
        msg = 'Command ' + command + ' completed successfuly';
      }

      winston.debug(msg);

      var durration = (new Date()).getTime() - start.getTime();
      var footer = '\n--------------------------------------------------------------------------------\n';
      footer += msg + '\nTotal execution time: ' + durration + ' ms\n';
      footer += '********************************************************************************\n\n';
      log.write(footer);
      log.end(); // Close the stream

      // Remove the timeout watcher
      if (timeoutInterval) {
        clearInterval(timeoutInterval);
      }

      // Callback as complete on next tick of the event loop
      process.nextTick(function () {
        callback(err, code, signal);
      });
    }

    // Execute the command
    var step = spawn(cmd, args, options);

    // If timeout specified, setup a timeout callback to kill the process
    if (options.timeout) {
      timeoutInterval = setInterval(
        function () {
          // We timed out, let's kill the process
          step.kill('SIGTERM');
          log.write('*** Process timed out after ' + options.timeout + 'ms, terminating! ***');
          winston.log('warn', 'Command ' + command + ' timed out after ' + options.timeout + 'ms, terminating!');
        },
        options.timeout
      );
    }

    winston.debug('Running: ' + command);

    var header = '********************************************************************************\n';
    header += 'Executing: ' + command + '\n';
    header += '--------------------------------------------------------------------------------\n\n';
    log.write(header);

    // Pipe stdout/err to a temporary log file
    step.stdout.pipe(log, {end: false});
    step.stderr.pipe(log, {end: false});

    step.on('error', function (err) {
      error = err;
    });

    step.on('close', function (code, signal) {
      wrapUp(error, code, signal);
    });
  }

};
