'use strict';

var chai = require('chai'),
    expect = chai.expect,
    Datastore = require('../../lib/datastore');

describe('Image Factory - Datastore', function () {

  describe('Datastore()', function () {

    it('should create a new Datastore', function (done) {

      var store = new Datastore();

      expect(store).to.exist;
      expect(store.get()).to.be.empty;
      done();
    });

  });

  describe('Datastore:get()', function () {

    it('should add an item to a Datastore, then get that item, expecting it to be equal to original item', function (done) {

      var store = new Datastore();

      var id = 'my-id',
          item = { item: 'this-is-a-test' };

      store.put(id, item);
      var result = store.get(id);

      expect(result).to.equal(item);
      done();
    });

  });

  describe('Datastore:put()', function () {

    it('should add a new item to a Datastore', function (done) {

      var store = new Datastore();

      var id = 'my-id',
          item = { item: 'this-is-a-test' };

      store.put(id, item);

      expect(store.get(id)).to.exist;
      expect(store.get(id)).to.equal(item);
      done();
    });

    it('should overwrite an existing item in a Datastore', function (done) {

      var store = new Datastore();

      var id = 'my-id',
          item1 = { item: 'this-is-the-first-test' },
          item2 = { item: 'this-is-the-second-test' };

      store.put(id, item1);

      expect(store.get(id)).to.exist;
      expect(store.get(id)).to.equal(item1);

      store.put(id, item2);

      expect(store.get(id)).to.exist;
      expect(store.get(id)).to.equal(item2);
      done();
    });

  });

});