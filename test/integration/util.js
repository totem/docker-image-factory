'use strict';

var chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect;

describe('Image Factory - Utilities', function () {

  describe('execute()', function () {

    var util = require('../../lib/util');

    it('should execute a system command, returning successfuly with exit code 0', function (done) {
      // execute(command, options, logFile, callback)
      var command = 'true',
          logFile = '/dev/null';

      util.execute(command, {}, logFile, function (err, code, signal) {
        expect(err).to.not.exist;
        expect(code).to.equal(0);
        expect(signal).to.not.exist;
        done();
      });

    });

    it('should execute a system command, failing with exit code 1', function (done) {
      // execute(command, options, logFile, callback)
      var command = 'false',
          logFile = '/dev/null';

      util.execute(command, {}, logFile, function (err, code, signal) {
        expect(err).to.exist;
        expect(code).to.equal(1);
        expect(signal).to.not.exist;
        done();
      });

    });

    it('should execute a system command, failing with system error', function (done) {
      // execute(command, options, logFile, callback)
      var command = 'this-is-a-garbage-command',
          logFile = '/dev/null';

      util.execute(command, {}, logFile, function (err, code, signal) {
        expect(err).to.exist;
        expect(code).to.equal(127);
        expect(signal).to.not.exist;
        done();
      });

    });

    it('should execute a system command, failing with timeout', function (done) {
      // execute(command, options, logFile, callback)
      var command = 'sleep 5000',
          logFile = '/dev/null';

      util.execute(command, { timeout: 500 }, logFile, function (err, code, signal) {
        expect(err).to.exist;
        expect(signal).to.equal('SIGTERM');
        done();
      });

    });

/*
    it('should execute a system command, failing with signal SIGUSR1', function (done) {
      // execute(command, options, logFile, callback)
      var command = 'sleep 5 & ; kill -SIGUSR1 $!',
          logFile = '/dev/null';

      util.execute(command, {}, logFile, function (err, code, signal) {
        expect(err).to.exist;
        expect(signal).to.equal('SIGUSR1');
        done();
      });

    });
*/

  });

});
