'use strict';

var chai = require('chai'),
  sinon = require('sinon'),
  BuildImageActivityHandler = require('../../../lib/swf/build-image-activity-handler'),
  constants = require('../../../lib/constants'),
  EventEmitter = require('events').EventEmitter,
  sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

describe('Image Factory - BuildImageActivityHandler', function () {
  var buildImageActivityHandler, mockFactory, mockTask, mockJob;
  beforeEach(function () {
    mockFactory = {
      newJobWithDefaults: sinon.stub(),
      toPublicJob: sinon.stub()
    };
    buildImageActivityHandler = new BuildImageActivityHandler(mockFactory);
    mockJob = new EventEmitter();
    mockTask = {
      config: {
        activityType: {
          name: constants.SWF.ACTIVITY_TYPES.BUILD_IMAGE.name,
          version: constants.SWF.ACTIVITY_TYPES.BUILD_IMAGE.version
        },
        input: '[{"mockObj":"mockObj"}]'
      },
      respondFailed: sinon.stub(),
      respondCompleted: sinon.stub(),
      recordHeartbeat: sinon.stub()
    };
  });

  it('should request factory to create new job', function () {
    buildImageActivityHandler.handle(mockTask);
    mockFactory.newJobWithDefaults.should.have.been.called.once;
    mockFactory.newJobWithDefaults.should.have.been.calledWith({'mockObj': 'mockObj'});
    mockFactory.newJobWithDefaults.args[0].should.have.length(3);
    mockFactory.newJobWithDefaults.args[0][1](mockJob);
  });


  it('should respondFailed when error is thrown during job creation', function () {
    buildImageActivityHandler.handle(mockTask);
    mockFactory.newJobWithDefaults.should.have.been.called.once;
    mockFactory.newJobWithDefaults.args[0].should.have.length(3);
    mockFactory.newJobWithDefaults.args[0][2]('MOCK_CODE', 'MOCK_MESSAGE');
    mockTask.respondFailed.should.have.been.called.once;

    var expectedDetails = {
      retryable: false,
      message: 'MOCK_MESSAGE',
      name: 'MOCK_CODE'
    };
    mockTask.respondFailed.should.have.been.calledWith(expectedDetails.message, expectedDetails);
    mockTask.respondFailed.args[0].should.have.length(3);
    //Call the callback function. No assertions needed.
    mockTask.respondFailed.args[0][2]();
  });

  it('should handle error when respondFailed fails during job creation', function () {
    buildImageActivityHandler.handle(mockTask);
    mockFactory.newJobWithDefaults.should.have.been.called.once;
    mockFactory.newJobWithDefaults.args[0].should.have.length(3);
    mockFactory.newJobWithDefaults.args[0][2]('MOCK_CODE', 'MOCK_MESSAGE');
    mockTask.respondFailed.should.have.been.called.once;
    mockTask.respondFailed.args[0].should.have.length(3);
    //Call the callback function. No assertions needed.
    mockTask.respondFailed.args[0][2]('mock error');
  });

  describe('Job Events', function () {
    var jobHandler;
    beforeEach(function () {
      mockFactory.toPublicJob.returns(mockJob);
      buildImageActivityHandler.handle(mockTask);
      mockFactory.newJobWithDefaults.should.have.been.called.once;
      mockFactory.newJobWithDefaults.args[0].should.have.length(3);
      jobHandler = mockFactory.newJobWithDefaults.args[0][1];
    });

    it('should respondCompleted when job creation succeeds', function (done) {
      jobHandler(mockJob);
      mockJob.emit(constants.EVENTS.STATUS_SUCCESS);
      mockTask.respondCompleted.should.have.been.calledOnce;
      mockTask.respondCompleted.should.have.been.calledWith(mockJob);
      mockTask.respondCompleted.args[0].should.have.length(2);
      mockTask.respondCompleted.args[0][1]();
      done();
    });

    it('should handle error when respondCompleted fails', function (done) {
      jobHandler(mockJob);
      mockJob.emit(constants.EVENTS.STATUS_SUCCESS);
      mockTask.respondCompleted.should.have.been.calledOnce;
      mockTask.respondCompleted.args[0].should.have.length(2);
      mockTask.respondCompleted.args[0][1]('MOCK_ERROR');
      done();
    });

    it('should record heartbeat on heartbeat event', function (done) {
      jobHandler(mockJob);
      mockJob.results = sinon.mock();
      mockJob.emit(constants.EVENTS.HEARTBEAT_EVENT);
      mockTask.recordHeartbeat.should.have.been.calledOnce;
      mockTask.recordHeartbeat.should.have.been.calledWith(mockJob.results);
      mockTask.recordHeartbeat.args[0].should.have.length(2);
      mockTask.recordHeartbeat.args[0][1]();
      done();
    });

    it('should handle error when record heartbeat fails', function (done) {
      jobHandler(mockJob);
      mockJob.results = sinon.mock();
      mockJob.emit(constants.EVENTS.HEARTBEAT_EVENT);
      mockTask.recordHeartbeat.should.have.been.calledOnce;
      mockTask.recordHeartbeat.args[0].should.have.length(2);
      mockTask.recordHeartbeat.args[0][1]('MOCK_HEARTBEAT_ERROR');
      done();
    });

    it('should respondFailed when job creation fails', function (done) {
      jobHandler(mockJob);
      mockJob.emit(constants.EVENTS.STATUS_FAILURE);
      mockTask.respondFailed.should.have.been.calledOnce;
      var expectedDetails = {
        retryable: true,
        message: 'Image job failed',
        name: 'IMAGE_JOB_FAILED',
        record: mockJob
      };
      mockTask.respondFailed.should.have.been.calledWith(expectedDetails.message, expectedDetails);
      mockTask.respondFailed.args[0].should.have.length(3);
      mockTask.respondFailed.args[0][2]();
      done();
    });

    it('should handle error when respondFailed execution fails', function (done) {
      jobHandler(mockJob);
      mockJob.emit(constants.EVENTS.STATUS_FAILURE);
      mockTask.respondFailed.should.have.been.calledOnce;
      mockTask.respondFailed.args[0].should.have.length(3);
      mockTask.respondFailed.args[0][2]('MOCK_ERROR');
      done();
    });



  });

});