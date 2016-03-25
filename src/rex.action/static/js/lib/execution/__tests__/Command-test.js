/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {assert} from 'rex-widget/testutils';

import * as Command from '../Command';
import * as Entity from '../../Entity';

describe('rex-action/execution', function() {

  describe('Command', function() {

    class Action {
      static commands = {
        @Command.command(Command.Types.Value())
        command(a) {
          return {a: a};
        }
      };
    }

    it('can decorate method', function() {
      assert(Action.commands.command instanceof Command.Command);
    });

    it('can query for command', function() {
      let command = Command.getCommand(<Action />, 'command');
      assert(command instanceof Command.Command);
      assert(command.execute(1).a === 1);
    });

    it('can query for command (onContextCommand)', function() {
      let command = Command.getCommand(<Action />, 'context');
      assert(command === Command.onContextCommand);
      assert.deepEqual(command.execute({}, {a: 1}, {b: 2}), {a: 1, b: 2});
    });

    describe('ValueType', function() {

      let type = Command.Types.Value();

      it('parses', function() {
        assert(type.parse(null, '1') === '1');
        assert(type.parse(null, '~') === null);
      });

      it('stringifies', function() {
        assert(type.stringify(null, 1) === '1');
        assert(type.stringify(null, null) === '~');
      });

    });

    describe('EntityType', function() {

      let type = Command.Types.Entity();

      it('parses', function() {
        assert.deepEqual(
          type.parse(null, 'individual:1'),
          Entity.createEntity('individual', 1)
        );
        assert.deepEqual(
          type.parse(null, ''),
          null
        );
        assert.deepEqual(
          type.parse(null, 'individual:1!state'),
          Entity.createEntity('individual', 1, null, {state: true})
        );
      });

      it('stringifies', function() {
        assert.deepEqual(
          type.stringify(null, Entity.createEntity('individual', 1)),
          'individual:1'
        );
        assert.deepEqual(
          type.stringify(null, null),
          ''
        );
        assert.deepEqual(
          type.stringify(null, Entity.createEntity('individual', 1, null, {state: true})),
          'individual:1!state'
        );
      });

    });

    describe('ConfigurableEntity', function() {

      let type = Command.Types.ConfigurableEntity();
      let element = {props: {entity: {type: {name: 'individual'}}}};

      it('parses', function() {
        assert.deepEqual(
          type.parse(element, ''),
          null
        );
        assert.deepEqual(
          type.parse(element, '1'),
          Entity.createEntity('individual', 1)
        );
        assert.deepEqual(
          type.parse(element, '1!state'),
          Entity.createEntity('individual', 1, null, {state: true})
        );
      });

      it('stringifies', function() {
        assert.deepEqual(
          type.stringify(null, null),
          ''
        );
        assert.deepEqual(
          type.stringify(element, Entity.createEntity('individual', 1)),
          '1'
        );
        assert.deepEqual(
          type.stringify(element, Entity.createEntity('individual', 1, null, {state: true})),
          '1!state'
        );
      });

    });

    describe('ObjectArgument', function() {

      let type = new Command.ObjectArgument();

      it('parses', function() {
        assert.deepEqual(
          type.parse(null, 'a=1,b=~individual:1'),
          {a: 1, b: Entity.createEntity('individual', 1)}
        );
      });

      it('stringifies', function() {
        assert.deepEqual(
          type.stringify(null, {a: 1, b: Entity.createEntity('individual', 1), c: null}),
          'a=1,b=~individual:1'
        );
      });

    });

  });

});
