'use strict';

var chai = require('chai'),
  sinon = require('sinon'),
  usingSignedRequest = require('../../../lib/restify/authorize-signature'),
  constants = require('../../../lib/constants'),
  EventEmitter = require('events').EventEmitter,
  restify = require('restify'),
  expect = chai.expect,
  sinonChai = require('sinon-chai');

describe('Image Factory - authorize', function () {
  var authorize,signature,next;

  beforeEach(function () {
    authorize = usingSignedRequest('changeit');
    signature = 'X-Hook-Signature';
    next = sinon.stub();
  });


  it('should authorize request when valid signature is passed', function (done) {
    var req = {
      body: '{"test": "data"}',
      header: sinon.stub()
    };
    req.header.withArgs(signature).returns('sha1=8c2dfb16db7498d0a1085c4b13f141282fbb75fd');

    authorize(req, null, next);

    next.should.have.been.calledWithExactly();
    done()
  });

   it('should authorize request with utf-8 encoded characters', function (done) {
    var req = {
      body: '{"test": "a’s"}',
      header: sinon.stub()
    };
    req.header.withArgs(signature).returns('sha1=d2b5883194460664a460e4523c2056d8e1a48512');

    authorize(req, null, next);

    next.should.have.been.calledWithExactly();
    done()
  });

   it('should fail to authorize request when invalid signature is passed', function (done) {
     var req = {
       body: '{"test": "data"}',
       header: sinon.stub()
     };
     req.header.withArgs(signature).returns('sha1=invalid');

     authorize(req, null, next);

     next.should.have.been.calledWithExactly(
        new restify.errors.InvalidCredentialsError(
            'Mismatch in computed signature and the passed signature of the request payload.'));

     done()
  });

});