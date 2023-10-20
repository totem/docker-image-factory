/*!
 * Docker Image Factory - Master Controller
 * Copyright(c) 2013 Meltmedia
 * By Mike Moulton <mike@meltmedia.com>
 * Apache 2 Licensed
 */

'use strict';

var winston = require('winston'),
    restify = require('restify'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    pkg = require('../package.json'),
    Datastore = require('./datastore'),
    JobRunner = require('./job'),
    corsResponse = require('./restify/cors'),
    usingSignedRequest = require('./restify/authorize-signature'),
    events = require('events'),
    util = require('util'),
    zSchema = require('z-schema'),
    path = require('path'),
    PostHookNotifier = require('./notification/posthook'),
    HipchatNotifier = require('./notification/hipchat'),
    SlackNotifier = require('./notification/slack'),
    nunjucks = require('nunjucks'),
    _ = require('lodash');

nunjucks.configure('templates', { autoescape: true });

var DEFAULT_CLONE_CMD = 'git clone --depth 100 --recurse-submodules --branch {{branch}} git@github.com:{{owner}}/{{repo}}.git ./',
    DEFAULT_CHECKOUT_CMD = 'git checkout -f {{commit}}',
    DEFAULT_BUILD_CMD = 'docker build -t {{dockerRepo}}/{{owner}}/{{repo}}:{{commit}} ./',
    DEFAULT_PUSH_CMD = 'docker push {{dockerRepo}}/{{owner}}/{{repo}}',
    SCHEMA_DIR = './schema';

// add json-schema to the cache.  This schema has moved to https and zSchema was having issues following redirects.
var JSON_SCHEMA_ORG_DRAFT_04_URL = 'http://json-schema.org/draft-04/schema#';
var JSON_SCHEMA_ORG_DRAFT_04_SCHEMA = require('../schema/json-schema-org-draft-04-schema.json');
zSchema.setRemoteReference(JSON_SCHEMA_ORG_DRAFT_04_URL, JSON.stringify(JSON_SCHEMA_ORG_DRAFT_04_SCHEMA));

var JOB_CREATE_SCHEMA = require('../schema/job-create.json');
var GITHUB_HOOK_SCHEMA = require('../schema/github-hook.json');


var DEFAULT_CONFIG = {
  port: 8080,
  defaults: {
    branch: 'develop',
    commit: 'HEAD',
    github: true,
    dockerRepoBase: process.env.DOCKER_REPO_BASE || 'registry.totem.local/totem'
  },
  tasks: {
    clone: {
      cmd: DEFAULT_CLONE_CMD,
      timeout: 900000 // 15 minutes
    },
    checkout: {
      cmd: DEFAULT_CHECKOUT_CMD,
      timeout: 60000 // 1 minute
    },
    build: {
      cmd: DEFAULT_BUILD_CMD,
      timeout: 1800000 // 30 minutes
    },
    push: {
      cmd: DEFAULT_PUSH_CMD,
      timeout: 1800000 // 30 minutes
    }
  },
  concurrentJobs: 1,
  hook: {
    secret: process.env.HOOK_SECRET || 'changeit',
    postUrl: process.env.HOOK_POST_URL || ''
  },
  hipchat: {
    token: process.env.HIPCHAT_TOKEN,
    room: process.env.HIPCHAT_ROOM
  },
  slack: {
    url: process.env.SLACK_URL,
    room: process.env.SLACK_ROOM
  },
  baseUrl: process.env.BASE_URL || 'http://localhost:8080',
  env: process.env.TOTEM_ENV || 'local'
};

module.exports = Factory;

/*
 * # Master Constructor
 * Init and configuration of AWS client and starts listening for messages on the inbound queue
 */
function Factory(config) {

  // Merge in custom config with defaults
  _.defaults(config, DEFAULT_CONFIG);

  // Store reference to current object
  var _this = this;

  // Save our config
  this.config = config;

  // Configure the JobRunner
  this.jobRunner = new JobRunner({ tasks: this.config.tasks });

  // Datastore for jobs
  this.jobs = new Datastore();

  // Initializes an empty job queue
  this.jobQueue = async.queue(function(job, callback) {

    // Start building an image when a job is taken from the queue
    job.start(function (err) {
      callback(err); // Job is considered finished

      var isSuccessful = (err ? false : true);
      var image = _this.getImage(job);

      //Notify build was successful / failed.
      var notifyCtx = _.extend({}, job.context, {
        baseUrl: _this.config.baseUrl,
        env: _this.config.env,
        id: job.id
      });
      notifyCtx.shortCommit = notifyCtx.commit.substring(0, 7);
      
      _.forEach(_this.notifiers, function(notifier) {
        notifier.notify(isSuccessful, notifyCtx, image);
      });

    });
  }, this.config.concurrentJobs); // Limit the number of concurrent jobs

  // Notification for job
  this.notifiers = [
    new PostHookNotifier(config.hook),
    new HipchatNotifier(config.hipchat),
    new SlackNotifier(config.slack)
  ];

  // Initialize the API
  this.initApi();
}

// Ensure we can emit events
util.inherits(Factory, events.EventEmitter);

/*
 * # Initialize the API
 */
Factory.prototype.initApi = function initApi() {
  var _this = this;

  function formatJson(req, res, body) {
    if (body instanceof Error) {
      return body.stack;
    }

    if (Buffer.isBuffer(body)) {
      return body.toString('base64');
    }

    var data = JSON.stringify(body);
    res.setHeader('Content-Length', Buffer.byteLength(data));

    return (data);
  }

  this.server = restify.createServer({
    name: pkg.name,
    version: pkg.version,
    formatters: {
      'application/vnd.sh.melt.cdp.if.job.v1+json; q=0.1': formatJson,
      'application/vnd.sh.melt.cdp.if.job-list.v1+json; q=0.1': formatJson,
      'application/vnd.sh.melt.cdp.if.job-create.v1+json; q=0.1': formatJson
    }
  });

  this.useDefaults = function() {
    return [
      restify.acceptParser(this.server.acceptable),
      restify.queryParser(),
      restify.bodyParser(),
      corsResponse()
    ];
  };

  this.useSignedGithubRequest = function() {
    var bodyParser = restify.bodyParser();
    return [
      restify.acceptParser(this.server.acceptable),
      restify.queryParser(),
      bodyParser[0], // First element contains middleware for parsing raw text,
      usingSignedRequest(_this.config.hook.secret, 'X-Hub-Signature'),
      // Second Element contains middleware for parsing JSON
      bodyParser[1],
      corsResponse()
    ];
  };

  // Server static schemas
  this.server.get('_schema/:name', this.useDefaults(), function (req, res, next) {
    var schemaPath = path.resolve(SCHEMA_DIR, req.params.name + '.json');
    try {
      var schema = fs.createReadStream(schemaPath);
      res.header('Content-Type', 'application/schema+json');
      schema.pipe(res);
      return next();
    } catch (e) {
      return next(new restify.InternalError('An unknown error occured: ' + e.message));
    }
  });

  this.server.get(/\/_jsonary\/?.*/, this.useDefaults(), restify.serveStatic({ directory: './static' }));

  // GET Root
  this.server.get('/', this.useDefaults(), function (req, res, next) {
    res.header('Link', '</_schema/ROOT>; rel="describedBy"');
    res.send({});
    return next();
  });

  // GET /job
  // Get a list of all jobs
  this.server.get('/job', this.useDefaults(), function (req, res, next) {
    var jobs = _this.jobs.get();
    async.map(
      Object.keys(jobs),
      function (key, cb) {
        var job = _this.toPublicJob(jobs[key]);
        cb(null, job);
      },
      function (err, results) {
        res.header('Content-Type', 'application/vnd.sh.melt.cdp.if.job-list.v1+json');
        res.header('Link', '</_schema/job-list>; rel="describedBy"');
        res.send(results);
        return next();
      }
    );
  });

  // GET /job/:id
  // Get the job specified by *id*
  this.server.get('/job/:id', this.useDefaults(), function (req, res, next) {
    var job = _this.jobs.get(req.params.id);
    if (job) {
      res.header('Content-Type', 'application/vnd.sh.melt.cdp.if.job.v1+json');
      res.header('Link', '</_schema/job>; rel="describedBy"');
      res.send(_this.toPublicJob(job));
      return next();
    } else {
      return next(new restify.ResourceNotFoundError('Unable to locate job with id: ' + req.params.id));
    }
  });

  // GET /job/:id/log
  // Get the build log for the job specified by *id*
  this.server.get('/job/:id/log', this.useDefaults(), function (req, res, next) {
    var job = _this.jobs.get(req.params.id);

    if (job) {
      // Stream the log back
      try {
        var log = fs.createReadStream(job.log);
        log.pipe(res);
        return next();
      } catch (e) {
        return next(new restify.InternalError('An unknown error occured: ' + e.message));
      }
    } else {
      return next(new restify.ResourceNotFoundError('Unable to locate job with id: ' + req.params.id));
    }
  });

  // POST /job
  // Create a new job
  this.server.post('/job', this.useDefaults(), function (req, res, next) {

    winston.debug('POST /job: ' + util.inspect(req.body));

    // POST should be of type 'application/vnd.sh.melt.cdp.if.job-create.v1+json'
    // By default, restify's body parser will not convert to JSON
    if (req.contentType() === 'application/vnd.sh.melt.cdp.if.job-create.v1+json') {
      try {
        req._body = req.body;
        req.body = JSON.parse(req.body);
      } catch (e) {
        winston.log('error', 'Error on POST /job due to: ' + e.message);
        return next(new restify.InternalError(e.message));
      }
    }

    var context = req.body;

    // Apply some sane defaults to the request
    _.defaults(context, _this.config.defaults);


    zSchema.validate(context, JOB_CREATE_SCHEMA, function (err) {
      if (err) {
        return next(new restify.InvalidContentError({ message: err.errors }));
      }
      return _this.createJob(req, res, context, next);
    });

  });


  // Github POST hook
  // Create a new job
  this.server.post('/hooks/github', this.useSignedGithubRequest(), function (req, res, next) {

    winston.debug('POST /hooks/github: ' + util.inspect(req.body));

    var context = req.body;

    if(req.header('X-GitHub-Event') !== 'push' || context.deleted) {
      //No job creation for delete request.
      res.send(204);
      return next();
    }

    zSchema.validate(req.body, GITHUB_HOOK_SCHEMA, function (err) {
      if (err) {
        return next(new restify.InvalidContentError({ message: err.errors }));
      }

      context = {
        'owner': context.repository.owner.name || context.repository.owner.login,
        'repo': context.repository.name,
        'commit': context.after || 'HEAD',
        'branch': path.basename(context.ref || 'develop'),
        'github': true
      };

      _.defaults(context, _this.config.defaults);
      return _this.createJob(req, res, context, next);
    });

  });

  // Start the API server
  this.server.listen(this.config.port || 8080, function () {
    winston.log('info', 'API listening at ' + _this.server.url);
  });

};

Factory.prototype.stop = function stop() {
  this.server.close();
};


/*
 * Spawn a new Job
 *
 * * context: A group a key/value pairs that will be available to executing tasks in the job
 * ```
 * {
 *   "param-1": "value-1"
 *   ...
 * }
 */
Factory.prototype.newJob = function newJob(context) {
  var _this = this;
  context.tag = context.tag || context.commit;
  var job = _this.jobRunner.newJob(context);
  // Store the Job in the datastore
  _this.jobs.put(job.id, job);
  // Add the Job to the job queue
  _this.jobQueue.push(job, function(err) {
      if(err) {
        winston.log('debug', 'Finished job ' + job.id + ' with errors.\n' + err.message);
      } else {
        winston.log('debug', 'Finished job ' + job.id);
      }
  });

  return job;
};

Factory.prototype.newJobWithDefaults = function newJobWithDefaults(context, onSuccess, onError) {
  _.defaults(context, this.config.defaults);
  onError = onError || function () {};
  onSuccess = onSuccess || function () {};
  var _this = this;
  zSchema.validate(context, JOB_CREATE_SCHEMA, function (err) {
    if (err) {
      return onError('SCHEMA_ERROR', err.errors);
    }
    var job = _this.newJob(context);
    return onSuccess(job);
  });
};

/*
 * Convert a Job into a public representation
 */
Factory.prototype.toPublicJob = function toPublicJob(job) {
  return {
    id: job.id,
    context: job.context,
    image: this.getImage(job),
    status: job.status,
    results: job.results,
    startTime: job.startTime,
    endTime: job.endTime
  };
};

Factory.prototype.getImage = function getImage(job) {
  return job.context.dockerRepoBase + '/' + job.context.owner + '-' + job.context.repo + ':' + job.context.tag;
};

/**
 * Creates Job from job context and generates the response after job is created.
 * @param req Request object
 * @param res Response object
 * @param context Job context holding job parameters (with defaults applied)
 * @param next next call to be executed.
 * @returns {*}
 */
Factory.prototype.createJob =  function createJob(req, res, context, next) {
  var _this = this;
  try {
    // Create a new job
    var job = _this.newJob(context);
    res.header('Content-Type', 'application/vnd.sh.melt.cdp.if.job.v1+json');
    res.header('Link', '</_schema/job>; rel="describedBy"');
    res.send(201, _this.toPublicJob(job));
    return next();
  } catch (e) {
    winston.log('error', 'Error on POST /job due to: ' + e.message);
    return next(new restify.InternalError(e.message));
  }
};
