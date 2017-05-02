/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as Entity from '../Entity';

describe('model/Entity', function() {
  describe('createEntity()', function() {
    it('fails if only type is specified', function() {
      // $FlowFixMe: do not fix, we test for it
      expect(() => Entity.createEntity('individual')).toThrow();
    });

    it('creates an entity of specified type', function() {
      expect(Entity.createEntity('individual', 100)).toEqual({
        id: '100',
        'meta:type': 'individual',
      });
    });

    it('can accepts additional props', function() {
      expect(Entity.createEntity('individual', 100, {x: 1, y: 2})).toEqual({
        id: '100',
        'meta:type': 'individual',
        x: 1,
        y: 2,
      });
    });

    it('can accepts additional state', function() {
      expect(Entity.createEntity('individual', 100, null, {x: true, y: false})).toEqual({
        id: '100',
        'meta:type': 'individual',
        'meta:state:x': true,
      });
    });
  });

  describe('isEntity()', function() {
    it('checks if an object is an entity', function() {
      expect(Entity.isEntity({id: 1, 'meta:type': 'individual'})).toBeTruthy();

      expect(Entity.isEntity(1)).toBeFalsy();
      expect(Entity.isEntity('individual')).toBeFalsy();
      expect(Entity.isEntity(null)).toBeFalsy();
      expect(Entity.isEntity(undefined)).toBeFalsy();
      expect(Entity.isEntity({id: 1})).toBeFalsy();
      expect(Entity.isEntity({'meta:type': 'individual'})).toBeFalsy();
      expect(Entity.isEntity({})).toBeFalsy();
    });
  });

  describe('getEntityState()', function() {
    it('extracts entity state', function() {
      expect(Entity.getEntityState({id: 1, 'meta:type': 'individual'})).toEqual({});
      expect(
        Entity.getEntityState({id: 1, 'meta:type': 'individual', 'meta:state:x': true}),
      ).toEqual({x: true});
      expect(
        Entity.getEntityState({
          id: 1,
          'meta:type': 'individual',
          'meta:state:x': false,
        }),
      ).toEqual({});
    });
  });

  describe('getEntityType()', function() {
    it('extracts entity type', function() {
      expect(Entity.getEntityType({id: 1, 'meta:type': 'individual'})).toEqual(
        'individual',
      );
    });
  });

  describe('getEntityTitle()', function() {
    it('extracts entity title as title field', function() {
      expect(
        Entity.getEntityTitle({id: 1, 'meta:type': 'individual', title: 'OK'}),
      ).toEqual('OK');
    });

    it('extracts entity title as __title__ field', function() {
      expect(
        Entity.getEntityTitle({id: 1, 'meta:type': 'individual', __title__: 'OK'}),
      ).toEqual('OK');
    });

    it('extracts entity title as meta:title field', function() {
      expect(
        Entity.getEntityTitle({id: 1, 'meta:type': 'individual', 'meta:title': 'OK'}),
      ).toEqual('OK');
    });
  });
});
