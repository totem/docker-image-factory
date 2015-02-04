'use strict';

var chai = require('chai'),
    expect = chai.expect,
    rewire = require('rewire'),
    sinon = require('sinon');

var JOB_CONFIG = {
  tasks: {
    cmd1: { cmd: '{{cmd1}}' },
    cmd2: { cmd: '{{cmd2}}' },
    cmd3: { cmd: '{{cmd3}}' }
  }
};

describe('Image Factory - Job Runner', function () {

  // rewire acts exactly like require.
  var jobModule = rewire('../../lib/job');

  before(function () {

    // Mock out 'fs' module in JobRunner
    var fsMock = {
      mkdirSync: function (path) { /* noop */ }
    };
    sinon.mock(fsMock).expects('mkdirSync').atLeast(1).atMost(2);
    jobModule.__set__('fs', fsMock);

    // Mock out 'fs' module in JobRunner
    var osMock = {
      tmpdir: function () { return '/tmp/12345'; }
    };
    jobModule.__set__('os', osMock);

    // Mock out 'wrench' module in JobRunner
    var wrenchMock = {
      rmdirSyncRecursive: function (path) { /* noop */ }
    };
    sinon.mock(wrenchMock).expects('rmdirSyncRecursive').atLeast(1).atMost(2);

    jobModule.__set__('wrench', wrenchMock);

    // Mock out 'helpers' module in JobRunner
    var helpersMock = {
      execute: function (command, options, logFile, callback) {
        var err = (command === 'success') ? null : new Error('Command Failed'),
            code = (command === 'success') ? 0 : 1,
            signal = null;

        callback(err, code, signal);
      }
    };
    jobModule.__set__('helpers', helpersMock);

  });

  describe('Job()', function () {

    it('should create a new Job with both valid tasks and context', function (done) {

      // Default JobRunner Config
      var jobContext = {
        cmd1: 'success',
        cmd2: 'success',
        cmd3: 'success'
      };

      // Configure the JobRunner / Job
      var Job = jobModule.__get__('Job');
      var job = new Job(JOB_CONFIG.tasks, jobContext);

      expect(job.tasks).to.deep.equal(JOB_CONFIG.tasks);
      expect(job.context).to.deep.equal(jobContext);
      done();
    });

    it('should create a new Job with only valid tasks', function (done) {

      // Default JobRunner Config
      var jobContext = {
        cmd1: 'success',
        cmd2: 'success',
        cmd3: 'success'
      };

      // Configure the JobRunner / Job
      var Job = jobModule.__get__('Job');
      var job = new Job(JOB_CONFIG.tasks);

      expect(job.tasks).to.deep.equal(JOB_CONFIG.tasks);
      expect(job.context).to.deep.equal({});
      done();
    });

    it('should create a new Job with invalid tasks', function (done) {

      // Configure the JobRunner / Job
      var Job = jobModule.__get__('Job');

      try {
        var job = new Job({});
        done(new Error('Job initialized with invalid tasks, expected an Error'));
      } catch (e) {
        expect(e).to.exist;
        done();
      }
    });

  });

  describe('Job:start()', function () {

    it('should execute two tasks in series successfuly', function (done) {

      // Default JobRunner Config
      var jobContext = {
        cmd1: 'success',
        cmd2: 'success',
        cmd3: 'success'
      };

      // Configure the JobRunner / Job
      var Job = jobModule.__get__('Job');
      var job = new Job(JOB_CONFIG.tasks, jobContext);

      // Test the job
      job.start(function (err) {
        expect(job.status).to.equal('success');
        expect(err).to.not.exist;
        done();
      });
    });

    it('should execute two tasks in series where the first one fails, skipping the second', function (done) {

      // Default JobRunner Config
      var jobContext = {
        cmd1: 'success',
        cmd2: 'failure',
        cmd3: 'success'
      };

      // Configure the Job
      var Job = jobModule.__get__('Job');
      var job = new Job(JOB_CONFIG.tasks, jobContext);

      // Test the job
      job.start(function (err) {
        expect(job.status).to.equal('failure');
        expect(job.results.cmd1.status).to.equal('success');
        expect(job.results.cmd2.status).to.equal('failure');
        expect(job.results.cmd3.status).to.equal('pending');
        expect(err).to.exist;
        done();
      });
    });

  });

  describe('JobRunner()', function () {

    it('should create a new JobRunner with a valid set of tasks', function (done) {
      // Configure the JobRunner / Job
      var jobRunner = new jobModule(JOB_CONFIG);

      expect(jobRunner.tasks).to.deep.equal(JOB_CONFIG.tasks);
      done();
    });

    it('should create a new JobRunner with an invalid set of tasks', function (done) {
      try {
        var jobRunner = new jobModule({ tasks: {}});
        done(new Error('JobRunner initialized with invalid tasks, expected an Error'));
      } catch (e) {
        expect(e).to.exist;
        done();
      }
    });

  });

  describe('JobRunner:newJob()', function () {

    it('should create a multiple new Jobs where the tasks are the same but with differing contexts', function (done) {
      var jobContext1 = {
        cmd1: 'success',
        cmd2: 'success',
        cmd3: 'success'
      };

      var jobContext2 = {
        cmd1: 'success',
        cmd2: 'failure',
        cmd3: 'success'
      };

      // Configure the JobRunner / Job
      var jobRunner = new jobModule(JOB_CONFIG);

      var job1 = jobRunner.newJob(jobContext1);
      var job2 = jobRunner.newJob(jobContext2);

      expect(job1.tasks).to.deep.equal(job2.tasks);
      expect(job1.context).to.not.deep.equal(job2.context);

      done();
    });

  });

});