/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as T from '../Type';
import * as E from '../Entity';

const domain = {};

describe('model/Type', function() {
  describe('Type', function() {
    it('match()', function() {
      let type = new T.Type();
      // $FlowFixMe: do not fix, we test for it specifically
      expect(() => type.match()).toThrow();
    });

    it('format()', function() {
      let type = new T.Type();
      expect(type.format()).toEqual('<unknown type>');
    });
  });

  describe('any', function() {
    it('match()', function() {
      expect(T.anytype.match(null, domain)).toBeTruthy();
      expect(T.anytype.match('string', domain)).toBeTruthy();
      expect(T.anytype.match(42, domain)).toBeTruthy();
      expect(T.anytype.match({}, domain)).toBeTruthy();
    });

    it('format()', function() {
      expect(T.anytype.format()).toEqual('<any>');
    });
  });

  describe('ValueType', function() {
    it('match()', function() {
      let type = new T.ValueType('string');
      expect(type.match(null, domain)).toBeTruthy();
      expect(type.match('string', domain)).toBeTruthy();
      expect(type.match(42, domain)).toBeTruthy();
      expect(type.match({}, domain)).toBeTruthy();
    });

    it('format()', function() {
      let type = new T.ValueType('string');
      expect(type.format()).toEqual('string');
    });
  });

  describe('EntityType', function() {
    it('match() (no state)', function() {
      const type = new T.EntityType('individual');
      expect(type.match(null, domain)).toBeFalsy();
      expect(type.match('string', domain)).toBeFalsy();
      expect(type.match(42, domain)).toBeFalsy();
      expect(type.match({}, domain)).toBeFalsy();
      expect(type.match(E.createEntity('study', 1), domain)).toBeFalsy();
      expect(type.match(E.createEntity('individual', 1), domain)).toBeTruthy();
    });

    it('match() (state)', function() {
      const domain = {
        individual: {},
      };
      const type = new T.EntityType('individual', {name: 'enrolled'});
      expect(type.match(null, domain)).toBeFalsy();
      expect(type.match('string', domain)).toBeFalsy();
      expect(type.match(42, domain)).toBeFalsy();
      expect(type.match({}, domain)).toBeFalsy();
      expect(type.match(E.createEntity('study', 1), domain)).toBeFalsy();
      expect(type.match(E.createEntity('individual', 1), domain)).toBeFalsy();
      expect(
        type.match(E.createEntity('individual', 1, null, {enrolled: true}), domain),
      ).toBeTruthy();
    });

    it('format() (no state)', function() {
      const type = new T.EntityType('individual');
      expect(type.format()).toEqual('individual');
    });

    it('format() (state)', function() {
      const type = new T.EntityType('individual', {name: 'enrolled'});
      expect(type.format()).toEqual('individual[enrolled]');
    });
  });

  describe('RecordType', function() {
    it('match()', function() {
      const type = new T.RecordType({
        entity: new T.RowType('entity', new T.EntityType('individual')),
        value: new T.RowType('value', new T.ValueType('string')),
        any: new T.RowType('any', T.anytype),
      });
      expect(type.match(null, domain)).toBeFalsy();
      expect(type.match('string', domain)).toBeFalsy();
      expect(type.match(42, domain)).toBeFalsy();
      expect(type.match({}, domain)).toBeFalsy();
      expect(
        type.match(
          {
            entity: E.createEntity('individual', 1),
          },
          domain,
        ),
      ).toBeFalsy();
      expect(
        type.match(
          {
            entity: E.createEntity('individual', 1),
            value: 'val',
          },
          domain,
        ),
      ).toBeFalsy();
      expect(
        type.match(
          {
            entity: E.createEntity('study', 1),
            value: 'val',
            any: true,
          },
          domain,
        ),
      ).toBeFalsy();
      expect(
        type.match(
          {
            entity: E.createEntity('individual', 1),
            value: 'val',
            any: true,
          },
          domain,
        ),
      ).toBeTruthy();
    });
  });
});
