'use strict';

var chai = require('chai'),
  sinon = require('sinon'),
  ImageFactoryActivities = require('../../../lib/swf/image-factory-activities'),
  constants = require('../../../lib/constants'),
  EventEmitter = require('events').EventEmitter,
  sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

describe('Image Factory - ImageFactoryActivities', function () {

  describe('stop()', function () {

    it('should stop the poller when stop is invoked', function (done) {
      var activityPollerMock = {
        on: sinon.spy(),
        stop: sinon.spy()
      };
      var activities = new ImageFactoryActivities(null, 'mock-domain', null,
        'mock-identity', 'mock-tasklist', activityPollerMock);
      activities.stop();

      activityPollerMock.stop.should.have.been.calledOnce;
      done();
    });

  });

  describe('start()', function () {

    it('should start the poller when start is invoked', function (done) {
      var activityPollerMock = {
        on: sinon.spy(),
        start: sinon.spy()
      };
      var activities = new ImageFactoryActivities(null, 'mock-domain', null,
        'mock-identity', 'mock-tasklist', activityPollerMock);
      activities.start();

      activityPollerMock.start.should.have.been.calledOnce;
      done();
    });

  });

  describe('activityPoller.on(activityTask)', function () {
    var activities, activityPoller, mockFactory, mockJob, mockTask, buildImageActivityHandler, pollerBackoff;

    beforeEach(function () {
      mockFactory = sinon.stub();
      buildImageActivityHandler = {
        handle: sinon.stub()
      };

      mockTask = {
        config: {
          activityType: {
            name: constants.SWF.ACTIVITY_TYPES.BUILD_IMAGE.name,
            version: constants.SWF.ACTIVITY_TYPES.BUILD_IMAGE.version
          },
          input: '[{"mockObj":"mockObj"}]'
        },
        respondFailed: sinon.stub()
      };

      mockJob = new EventEmitter();
      activityPoller = new EventEmitter();
      pollerBackoff = new EventEmitter();
      pollerBackoff.backoff = sinon.stub();
      activities = new ImageFactoryActivities(null, 'mock-domain', mockFactory,
        'mock-identity', 'mock-tasklist', activityPoller, buildImageActivityHandler, pollerBackoff);
    });

    it('should poll for new activities', function (done) {
      activityPoller.emit('poll');
      done();
      //Nothing to  be validated (No exception is thrown).
    });

    it('should respondFailed when unknown activity Type is received', function (done) {
      mockTask.config.activityType.name = 'Mock';
      activityPoller.emit('activityTask', mockTask);
      mockTask.respondFailed.should.have.been.calledOnce;
      var expectedDetails = {
        retryable: false,
        message: 'Unsupported Activity Type Mock-' + mockTask.config.activityType.version,
        name: 'UNSUPPORTED_IMAGE_ACTIVITY'
      };
      mockTask.respondFailed.should.have.been.calledWith(expectedDetails.message, expectedDetails);
      mockTask.respondFailed.args[0].should.have.length(3);
      mockTask.respondFailed.args[0][2]();
      done();
    });

    it('should handle error when respondFailed errors out', function (done) {
      mockTask.config.activityType.name = 'Mock';
      activityPoller.emit('activityTask', mockTask);
      mockTask.respondFailed.should.have.been.calledOnce;
      mockTask.respondFailed.args[0].should.have.length(3);
      mockTask.respondFailed.args[0][2]('MOCK_ERROR');
      done();
    });

    it('should handle build image activity', function (done) {
      activityPoller.emit('activityTask', mockTask);
      buildImageActivityHandler.handle.should.have.been.calledOnce;
      buildImageActivityHandler.handle.should.have.been.calledWithExactly(mockTask);
      done();
    });

    it('should handle error when activityPoller fails', function (done) {
      activityPoller.emit('error', 'MockError');
      pollerBackoff.backoff.should.have.been.calledOnce;
      pollerBackoff.backoff.should.have.been.calledWithExactly();
      done();
    });


  });

  describe('pollerBackoff.on', function () {
    var activityPoller, pollerBackoff, activities;

    beforeEach(function () {
      activityPoller = new EventEmitter();
      activityPoller.start = sinon.stub();
      pollerBackoff = new EventEmitter();
      activities = new ImageFactoryActivities(null, 'mock-domain', null,
        'mock-identity', 'mock-tasklist', activityPoller, null, pollerBackoff);
    });

    it('should handle backoff event', function (done) {
      pollerBackoff.emit('backoff', 1, 1000);
      done();
    });

    it('should handle ready event', function (done) {
      pollerBackoff.emit('ready');
      activityPoller.start.should.have.been.calledOnce;
      activityPoller.start.should.have.been.calledWithExactly();
      done();
    });

    it('should handle failed event', function (done) {
      pollerBackoff.emit('fail', 5);
      done();
    });

  });
});