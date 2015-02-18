'use strict';

var chai = require('chai'),
    expect = chai.expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

describe('Image Factory - Hipchat', function () {

  // rewire acts exactly like require.
  var hipchatModule = rewire('../../../lib/notification/hipchat');
  var HipchatNotifier = hipchatModule.__get__('HipchatNotifier');
  var nunjucksMock, chatterMock;

  beforeEach(function () {
    nunjucksMock = {
      render: sinon.spy()
    };
    chatterMock = {
      notify: sinon.spy()
    };
    hipchatModule.__set__('nunjucks', nunjucksMock);

  });

  describe('HipchatNotifier::isEnabled', function () {

    it('should return true when token and room are given', function (done) {

      var cfg = {
        token: 'mocktoken',
        room: 'mockroom'
      };

      var HipchatNotifier = hipchatModule.__get__('HipchatNotifier');
      var notifier = new HipchatNotifier(cfg);

      var isEnabled = notifier.isEnabled();

      expect(isEnabled).to.equal(true);
      done();
    });

    it('should return false when token/room are not specified', function (done) {

      var cfg = {};

      var HipchatNotifier = hipchatModule.__get__('HipchatNotifier');
      var notifier = new HipchatNotifier(cfg);

      var isEnabled = notifier.isEnabled();

      expect(isEnabled).to.equal(false);
      done();
    });
  });

  describe('HipchatNotifier::notify', function () {
    it('should create hipchat notification on failed build', function (done) {

      var cfg = {
        token: 'mocktoken',
        room: 'mockroom'
      };

      nunjucksMock.render = function(template, context, cb) {
        cb(null, 'mocktemplate')
      };

      var notifier = new HipchatNotifier(cfg, chatterMock);
      notifier.notify(false, {}, 'mockimage');
      chatterMock.notify.should.have.been.calledOnce;
      done();
    });

    it('should not create hipchat notification on successful build', function (done) {
      var cfg = {
        token: 'mocktoken',
        room: 'mockroom'
      };

      nunjucksMock.render = function(template, context, cb) {
        cb(null, 'mocktemplate')
      };

      var notifier = new HipchatNotifier(cfg, chatterMock);
      notifier.notify(true, {}, 'mockimage');
      chatterMock.notify.should.not.have.been.called;
      done();
    });

    it('should not create hipchat notification when disabled', function (done) {
      var cfg = {}; //Empty cfg will disable notification

      nunjucksMock.render = function(template, context, cb) {
        cb(null, 'mocktemplate')
      };

      var notifier = new HipchatNotifier(cfg, chatterMock);
      notifier.notify(false, {}, 'mockimage');
      chatterMock.notify.should.not.have.been.called;
      done();
    });

    it('should not create hipchat notification when template rendering fails', function (done) {
      var cfg = {
        token: 'mocktoken',
        room: 'mockroom'
      };

      nunjucksMock.render = function(template, context, cb) {
        cb({message: 'somerror'}, 'mocktemplate')
      };

      var notifier = new HipchatNotifier(cfg, chatterMock);
      notifier.notify(false, {}, 'mockimage');
      chatterMock.notify.should.not.have.been.called;
      done();
    });

    it('should handle hipchat call failure', function (done) {
      var cfg = {
        token: 'mocktoken',
        room: 'mockroom'
      };

      nunjucksMock.render = function(template, context, cb) {
        cb(null, 'mocktemplate')
      };

      chatterMock.notify = function(room, ctx, cb) {
        cb({message: 'somerror'});
      };

      var notifier = new HipchatNotifier(cfg, chatterMock);
      notifier.notify(false, {}, 'mockimage');
      done();
    });
  });

});
