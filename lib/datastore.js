/*!
 * Docker Image Factory - Datastore
 * Copyright(c) 2013 Meltmedia
 * By Mike Moulton <mike@meltmedia.com>
 * Apache 2 Licensed
 */

'use strict';

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