/**
 * @copyright 2015, Prometheus Research, LLC
 */

import assert       from 'power-assert';
import * as Entity  from '../Entity';

describe('rex-action', function() {

  describe('Entity', function() {

    describe('createEntity', function() {

      it('fails if only type is specified', function() {
        assert.throws(
          () => Entity.createEntity('individual'),
          'Invariant Violation: id cannot be null or undefined');
      });

      it('creates an entity of specified type', function() {
        assert.deepEqual(
          Entity.createEntity('individual', 100),
          {
            id: 100,
            'meta:type': 'individual',
          });
      });

      it('can accepts additional props', function() {
        assert.deepEqual(
          Entity.createEntity('individual', 100, {x: 1, y: 2}),
          {
            id: 100,
            'meta:type': 'individual',
            x: 1,
            y: 2,
          });
      });

      it('can accepts additional state', function() {
        assert.deepEqual(
          Entity.createEntity('individual', 100, null, {x: true, y: false}),
          {
            id: 100,
            'meta:type': 'individual',
            'meta:state:x': true,
          });
      });

    });

    describe('isEntity', function() {

      it('checks if an object is an entity', function() {
        assert(Entity.isEntity({id: 1, 'meta:type': 'individual'}));

        assert(!Entity.isEntity(1));
        assert(!Entity.isEntity('individual'));
        assert(!Entity.isEntity(null));
        assert(!Entity.isEntity(undefined));
        assert(!Entity.isEntity({id: 1}));
        assert(!Entity.isEntity({'meta:type': 'individual'}));
        assert(!Entity.isEntity({}));
      });

    });

    describe('getEntityState', function() {

      it('extracts entity state', function() {
        assert.deepEqual(
          Entity.getEntityState({id: 1, 'meta:type': 'individual'}),
          {});
        assert.deepEqual(
          Entity.getEntityState({id: 1, 'meta:type': 'individual', 'meta:state:x': true}),
          {x: true});
        assert.deepEqual(
          Entity.getEntityState({id: 1, 'meta:type': 'individual', 'meta:state:x': false}),
          {});
      });

    });

    describe('getEntityType', function() {

      it('extracts entity type', function() {
        assert.deepEqual(
          Entity.getEntityType({id: 1, 'meta:type': 'individual'}),
          'individual');
      });

    });

    describe('getEntityTitle', function() {

      it('extracts entity title as title field', function() {
        assert.deepEqual(
          Entity.getEntityTitle({id: 1, 'meta:type': 'individual', 'title': 'OK'}),
          'OK');
      });

      it('extracts entity title as __title__ field', function() {
        assert.deepEqual(
          Entity.getEntityTitle({id: 1, 'meta:type': 'individual', '__title__': 'OK'}),
          'OK');
      });

      it('extracts entity title as meta:title field', function() {
        assert.deepEqual(
          Entity.getEntityTitle({id: 1, 'meta:type': 'individual', 'meta:title': 'OK'}),
          'OK');
      });

    });

  });

});
