/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {assert} from 'rex-widget/testutils';
import * as Typing from '../Typing';
import * as Entity from '../Entity';

describe('rex-action', function() {

  describe('Typing', function() {

    describe('Type', function() {

      it('match()', function() {
        let type = new Typing.Type();
        assert.throws(() => type.match());
      });

      it('format()', function() {
        let type = new Typing.Type();
        assert(type.format() === '<unknown type>');
      });

    });

    describe('any', function() {

      it('match()', function() {
        assert(Typing.anytype.match(null));
        assert(Typing.anytype.match('string'));
        assert(Typing.anytype.match(42));
        assert(Typing.anytype.match({}));
      });

      it('format()', function() {
        assert(Typing.anytype.format() === '<any>');
      });

    });

    describe('ValueType', function() {

      it('match()', function() {
        let type = new Typing.ValueType('string');
        assert(type.match(null));
        assert(type.match('string'));
        assert(type.match(42));
        assert(type.match({}));
      });

      it('format()', function() {
        let type = new Typing.ValueType('string');
        assert(type.format() === 'string');
      });

    });

    describe('EntityType', function() {

      it('match() (no state)', function() {
        let type = new Typing.EntityType('individual');
        assert(!type.match(null));
        assert(!type.match('string'));
        assert(!type.match(42));
        assert(!type.match({}));
        assert(!type.match(Entity.createEntity('study', 1)));
        assert(type.match(Entity.createEntity('individual', 1)));
      });

      it('match() (state)', function() {
        let type = new Typing.EntityType('individual', {name: 'enrolled'});
        assert(!type.match(null));
        assert(!type.match('string'));
        assert(!type.match(42));
        assert(!type.match({}));
        assert(!type.match(Entity.createEntity('study', 1)));
        assert(!type.match(Entity.createEntity('individual', 1)));
        assert(type.match(Entity.createEntity('individual', 1, null, {enrolled: true})));
      });

      it('format() (no state)', function() {
        let type = new Typing.EntityType('individual');
        assert(type.format() === 'individual');
      });

      it('format() (state)', function() {
        let type = new Typing.EntityType('individual', {name: 'enrolled'});
        assert(type.format() === 'individual[enrolled]');
      });

    });

    describe('RecordType', function() {

      it('match()', function() {
        let type = new Typing.RecordType({
          entity: new Typing.RowType('entity', new Typing.EntityType('individual')),
          value: new Typing.RowType('value', new Typing.ValueType('string')),
          any: new Typing.RowType('any', Typing.anytype),
        });
        assert(!type.match(null));
        assert(!type.match('string'));
        assert(!type.match(42));
        assert(!type.match({}));
        assert(!type.match({
          entity: Entity.createEntity('individual', 1),
        }));
        assert(!type.match({
          entity: Entity.createEntity('individual', 1),
          value: 'val',
        }));
        assert(!type.match({
          entity: Entity.createEntity('study', 1),
          value: 'val',
          any: true
        }));
        assert(type.match({
          entity: Entity.createEntity('individual', 1),
          value: 'val',
          any: true
        }));
      });

    });

  });

});
