/*!
 * Docker Image Factory - Datastore
 * Copyright(c) 2013 Meltmedia
 * By Mike Moulton <mike@meltmedia.com>
 * Apache 2 Licensed
 */

'use strict';

var winston = require('winston');

module.exports = Datastore;

/*
 * # Datastore
 */
function Datastore() {
  // TODO: Switch this to something that can manage the size, evict old, etc. LRU maybe?
  this.cache = [];
}

Datastore.prototype.get = function get(id) {
  return id ? this.cache[id]: this.cache;
};

Datastore.prototype.put = function put(id, value) {
  this.cache[id] = value;
};

Datastore.prototype.isDuplicate = function isDuplicate(job, time) {
  var jobs = [];
  var keys = Object.keys(this.cache);

	for(var i = 0; i < keys.length; i++) {
		if(keys[i]) {
			var id = keys[i];
	    jobs.push(this.cache[id]);
	  }
  }

	for (var j = 0; j < jobs.length; j++) {
		var otherJob = jobs[j];
		if(job.id !== otherJob.id) {
			var now = Date.now();
			var diff = now - otherJob.startTime.getTime();
			if(diff <= time) {
				if(JSON.stringify(job.context) === JSON.stringify(otherJob.context)) {
					return true;
				}
			}
		}
	}

  return false;
};

