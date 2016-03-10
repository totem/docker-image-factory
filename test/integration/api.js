var chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    request = require('request'),
    async = require('async'),
    http = require('http'),
    zSchema = require('z-schema'),
    util = require('util'),
    _ = require('lodash'),
    Factory = require('../../lib/factory');

var PORT = 12919,
    BASE_URL = 'http://127.0.0.1:' + PORT;

var factoryConfig = {
  port: PORT,
  defaults: {
    branch: 'develop',
    commit: 'HEAD'
  },
  tasks: {
    clone: {
      cmd: 'true',
      timeout: 10000
    },
    checkout: {
      cmd: 'true',
      timeout: 10000
    },
    build: {
      cmd: 'true',
      timeout: 10000
    },
    push: {
      cmd: 'true',
      timeout: 10000
    }
  }
};

var MINIMUM_BUILD_REQUEST = {
  owner: "fake-owner",
  repo: "fake-repo"
};

var GIT_HOOK_PUSH_REQUEST_STR = '{ \
  "ref": "fake-owner/fake-repo/fake-branch", \
  "after": "1234", \
  "repository": { \
    "name": "fake-repo", \
    "owner": { \
      "name": "fake-owner" \
    } \
  }, \
  "deleted": false \
}';

var GIT_HOOK_DELETE_REQUEST_STR = '{ \
  "ref": "fake-owner/fake-repo/fake-branch", \
  "after": "1234", \
  "repository": { \
    "name": "fake-repo", \
    "owner": { \
      "name": "fake-owner" \
    } \
  }, \
  "deleted": true \
}';

var FULL_BUILD_REQUEST = {
  owner: "fake-owner",
  repo: "fake-repo",
  branch: "fake-branch",
  commit: "1234",
  realm: "dev"
};

describe('Image Factory - REST API', function () {

  var factoryInstance;

  beforeEach(function () {
    factoryInstance = new Factory(factoryConfig);
  });

  afterEach(function () {
    factoryInstance.stop();
  });

  describe('POST /job', function () {

    it('should create a new Job and return a status code 202 when POST /job with a valid minimum payload', function (done) {
      request.post(
        BASE_URL + '/job',
        {
          body: JSON.stringify(MINIMUM_BUILD_REQUEST),
          headers: { 'Content-Type': 'application/vnd.sh.melt.cdp.if.job-create.v1+json'}
        },
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(201);
          expect(response.headers).to.include.keys('link');
          expect(response.headers['link']).to.contain('</_schema/job>; rel="describedBy"');
          expect(response.headers).to.include.keys('content-type');
          expect(response.headers['content-type']).to.contain('application/vnd.sh.melt.cdp.if.job.v1+json');
          var job = JSON.parse(body);
          expect(job.id).to.exist;
          done();
        }
      );
    });

    it('should create a new Job and return a status code 202 when POST /job with a valid full payload', function (done) {
      request.post(
        BASE_URL + '/job',
        {
          body: JSON.stringify(FULL_BUILD_REQUEST),
          headers: { 'Content-Type': 'application/vnd.sh.melt.cdp.if.job-create.v1+json'}
        },
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(201);
          expect(response.headers).to.include.keys('link');
          expect(response.headers['link']).to.contain('</_schema/job>; rel="describedBy"');
          expect(response.headers).to.include.keys('content-type');
          expect(response.headers['content-type']).to.contain('application/vnd.sh.melt.cdp.if.job.v1+json');
          var job = JSON.parse(body);
          expect(job.id).to.exist;
          done();
        }
      );
    });

    it('should return a status code 400 when POST /job with an invalid payload', function (done) {
      request.post(
        BASE_URL + '/job',
        {
          body: JSON.stringify({ }),
          headers: { 'Content-Type': 'application/vnd.sh.melt.cdp.if.job-create.v1+json'}
        },
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(400);
          expect(body.id).to.not.exist;
          done();
        }
      );
    });

  });

  describe('POST /hooks/github', function () {
    it('should create a new Job and return a status code 201 ' +
        'when POST /hooks/github with a valid payload', function (done) {
      request.post(
        BASE_URL + '/hooks/github',
        {
          body: GIT_HOOK_PUSH_REQUEST_STR,
          headers: {
            'Content-Type': 'application/json',
            'X-GitHub-Event': 'push',
            'X-Hub-Signature': 'sha1=75486e24e49d01aa87cff3951314993ce649cc8a'
          }
        },
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(201);
          expect(response.headers).to.include.keys('link');
          expect(response.headers['link']).to.contain('</_schema/job>; rel="describedBy"');
          expect(response.headers).to.include.keys('content-type');
          expect(response.headers['content-type']).to.contain('application/vnd.sh.melt.cdp.if.job.v1+json');
          var job = JSON.parse(body);
          expect(job.id).to.exist;
          done();
        }
      );
    });

    it('should return No Content when POST /hooks/github with deleted flag as true', function (done) {
      request.post(
        BASE_URL + '/hooks/github',
        {
          body: GIT_HOOK_DELETE_REQUEST_STR,
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature': 'sha1=b1b6f5e7379d550cfaaf597d90f26d832d999f3f',
            'X-GitHub-Event': 'push'
          }
        },
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(204);
          done();
        }
      );
    });

    it('should return Unauthorized response when invalid signature is passed', function (done) {
      request.post(
              BASE_URL + '/hooks/github',
          {
            body: GIT_HOOK_PUSH_REQUEST_STR,
            headers: {
              'Content-Type': 'application/json',
              'X-Hub-Signature': 'sha1=invalid'
            }
          },
          function (err, response, body) {
            expect(err).to.not.exist;
            expect(response.statusCode).to.equal(401);
            done();
          }
      );
    });

  });

  describe('GET /job/{id}', function () {

    it('should return status code 200 and a valid Job when requesting GET /job/{id} using a valid {id}', function (done) {

      request.post(
        BASE_URL + '/job',
        { json: FULL_BUILD_REQUEST },
        function (err, response, body) {
          get(body.id);
        }
      );

      function get(id) {
        request.get(
          BASE_URL + '/job/' + id,
          function (err, response, body) {
            expect(err).to.not.exist;
            expect(response.statusCode).to.equal(200);
            expect(response.headers).to.include.keys('link');
            expect(response.headers['link']).to.contain('</_schema/job>; rel="describedBy"');
            expect(response.headers).to.include.keys('content-type');
            expect(response.headers['content-type']).to.contain('application/vnd.sh.melt.cdp.if.job.v1+json');
            var job = JSON.parse(body);
            expect(job.id).to.equal(id);
            done();
          }
        );
      }
    });

    it('should return a status code 404 when requesting GET /job/{id} using an invalid {id}', function (done) {
      request.get(
        BASE_URL + '/job/does-not-exist',
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(404);
          done();
        }
      );
    });

    it('should return a Job that validates to a JSON Schema provided by a Link header when requesting GET /job/{id} using a valid {id}', function (done) {

      request.post(
        BASE_URL + '/job',
        { json: FULL_BUILD_REQUEST },
        function (err, response, body) {
          get(body.id);
        }
      );

      function get(id) {
        request.get(
          BASE_URL + '/job/' + id,
          function (err, response, body) {
            expect(err).to.not.exist;

            expect(response.headers).to.include.keys('link');
            expect(response.headers['link']).to.contain('</_schema/job>; rel="describedBy"');
            var job = JSON.parse(body);

            request.get(
              BASE_URL + '/_schema/job',
              function (err, response, body) {
                expect(err).to.not.exist;
                var schema = JSON.parse(body);
                var report = zSchema.validate(job, schema, function(err) {
                  expect(err).to.not.exist;
                  done();
                });
              }
            );
          }
        );
      }
    });


  });

  describe('GET /job/{id}/log', function () {

    it('should return status code 200 and a execution log when requesting GET /job/{id}/log using a valid {id}', function (done) {

      request.post(
        BASE_URL + '/job',
        { json: FULL_BUILD_REQUEST },
        function (err, response, body) {
          setTimeout(function() {
            get(body.id);
          }, 1000); // Give some time to start the job to complete.
        }
      );

      function get(id) {
        request.get(
          BASE_URL + '/job/' + id + '/log',
          function (err, response, body) {
            expect(err).to.not.exist;
            expect(response.statusCode).to.equal(200);
            expect(body).to.contain('Command true completed successfuly');
            done();
          }
        );
      }
    });

    it('should return a status code 404 when requesting GET /job/{id}/log using an invalid {id}', function (done) {
      request.get(
        BASE_URL + '/job/does-not-exist/log',
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(404);
          done();
        }
      );
    });

  });
  
  // TODO: This test needs to be rewritten to account for coalescing
  describe('GET /job', function () {

    it('should return a list of known Jobs when requesting GET /job', function (done) {

      async.times(
        5,
        function (n, next) {
          request.post(
            BASE_URL + '/job',
            { json: FULL_BUILD_REQUEST },
            function (err, response, body) {
              next(err);
            }
          );
        },
        function (err, results) {
          request.get(
            BASE_URL + '/job',
            function (err, response, body) {
              expect(err).to.not.exist;
              expect(response.statusCode).to.equal(200);
              expect(response.headers).to.include.keys('link');
              expect(response.headers['link']).to.contain('</_schema/job-list>; rel="describedBy"');
              expect(response.headers).to.include.keys('content-type');
              expect(response.headers['content-type']).to.contain('application/vnd.sh.melt.cdp.if.job-list.v1+json');
              var results = JSON.parse(body);
              expect(results).to.have.length(5);
              done();
            }
          );
        }
      );

    });

  });

  describe('GET /_schema', function () {

    it('should return a valid draft-4 schema for GET /_schema/ROOT', function (done) {

      request.get(
        BASE_URL + '/_schema/ROOT',
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(200);
          var schema = JSON.parse(body);
          expect(schema['$schema']).to.equal('http://json-schema.org/draft-04/schema');
          done();
        }
      );

    });

    it('should return a valid draft-4 schema for GET /_schema/job', function (done) {

      request.get(
        BASE_URL + '/_schema/job',
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(200);
          var schema = JSON.parse(body);
          expect(schema['$schema']).to.equal('http://json-schema.org/draft-04/schema');
          done();
        }
      );

    });

    it('should return a valid draft-4 schema for GET /_schema/job-list', function (done) {

      request.get(
        BASE_URL + '/_schema/job-list',
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(200);
          var schema = JSON.parse(body);
          expect(schema['$schema']).to.equal('http://json-schema.org/draft-04/schema');
          done();
        }
      );

    });

    it('should return a valid draft-4 schema for GET /_schema/job-create', function (done) {

      request.get(
        BASE_URL + '/_schema/job-create',
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(200);
          var schema = JSON.parse(body);
          expect(schema['$schema']).to.equal('http://json-schema.org/draft-04/schema');
          done();
        }
      );

    });

  });

  describe('GET /', function () {

    it('should GET / and return a valid JSON Hyper-Schema Link', function (done) {

      request.get(
        BASE_URL + '/',
        function (err, response, body) {
          expect(err).to.not.exist;
          expect(response.statusCode).to.equal(200);
          expect(response.headers).to.include.keys('link');
          expect(response.headers['link']).to.contain('</_schema/ROOT>; rel="describedBy"');
          done();
        }
      );

    });

  });

});