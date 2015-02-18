'use strict';

var chai = require('chai'),
    expect = chai.expect,
    rewire = require('rewire'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

describe('Image Factory - Post Hook', function () {

  // rewire acts exactly like require.
  var posthookModule = rewire('../../../lib/notification/posthook');
  var requestMock = {
    post: sinon.spy()
  };

  before(function () {
    posthookModule.__set__('request', requestMock);
  });

  describe('PostHookNotifier::isEnabled', function () {

    it('should return true when notification url is set', function (done) {

      var hookConfig = {
        postUrl: 'mockurl'
      };

      var PostHookNotifier = posthookModule.__get__('PostHookNotifier');
      var notifier = new PostHookNotifier(hookConfig);

      var isEnabled = notifier.isEnabled();

      expect(isEnabled).to.equal(true);
      done();
    });

    it('should return false when notification url is set', function (done) {

      var hookConfig = {};

      var PostHookNotifier = posthookModule.__get__('PostHookNotifier');
      var notifier = new PostHookNotifier(hookConfig);

      var isEnabled = notifier.isEnabled();

      expect(isEnabled).to.equal(false);
      done();
    });
  });

  describe('PostHookNotifier::signRequest', function () {

    it('should return signed request', function (done) {

      var hookConfig = {
        postUrl: 'mockurl',
        secret: 'mock'
      };

      var PostHookNotifier = posthookModule.__get__('PostHookNotifier');
      var notifier = new PostHookNotifier(hookConfig);

      var signature = notifier.signRequest('mockdata');

      expect(signature).to.equal('c1ed499ea527bb9c7e7541c932ec95d71c53681d');
      done();
    });
  });

  describe('PostHookNotifier::notify', function () {

    it('should create web notification when notification is enabled', function (done) {

      var hookConfig = {
        postUrl: 'mockurl',
        secret: 'mock'
      };

      var PostHookNotifier = posthookModule.__get__('PostHookNotifier');
      var notifier = new PostHookNotifier(hookConfig);
      var context = {
        repo: 'mockrepo',
        owner: 'mockowner',
        commit: 'mockcommit',
        branch: 'mockbranch'
      };

      notifier.notify(true, context, 'mockimage');
      requestMock.post.should.have.been.calledOnce;
      done();
    });
  });

});
