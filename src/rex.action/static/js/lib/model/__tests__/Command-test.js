/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import React from 'react';

import * as C from '../Command';
import * as E from '../Entity';

describe('model/Command', function() {
  describe('Command', function() {
    class Action extends React.Component {
      static commands = {
        command: new C.Command(
          (props, context, a) => {
            return {a: a};
          },
          'command',
          [C.Types.Value()],
        ),
      };
    }

    it('can decorate method', function() {
      expect(Action.commands.command).toBeInstanceOf(C.Command);
    });

    it('can query for command', function() {
      let command = C.getCommand(<Action />, 'command');
      expect(command).toBeInstanceOf(C.Command);
      invariant(command != null, 'Oops');
      expect(command.execute({}, {}, [1]).a).toEqual(1);
    });

    it('can query for command (onContextCommand)', function() {
      let command = C.getCommand(<Action />, 'context');
      expect(command).toEqual(C.onContextCommand);
      invariant(command != null, 'Oops');
      expect(command.execute({}, {a: 1}, [{b: 2}])).toEqual({a: 1, b: 2});
    });

    describe('ValueType', function() {
      let type = C.Types.Value();

      it('parses', function() {
        expect(type.parse({}, '1')).toEqual('1');
        expect(type.parse({}, '~')).toEqual(null);
      });

      it('stringifies', function() {
        expect(type.stringify({}, 1)).toEqual('1');
        expect(type.stringify({}, null)).toEqual('~');
      });
    });

    describe('EntityType', function() {
      let type = C.Types.Entity();

      it('parses', function() {
        expect(type.parse({}, 'individual:1')).toEqual(E.createEntity('individual', 1));
        expect(type.parse({}, '')).toEqual(null);
        expect(type.parse({}, 'individual:1')).toEqual(
          E.createEntity('individual', 1, null),
        );
      });

      it('stringifies', function() {
        expect(type.stringify({}, E.createEntity('individual', 1))).toEqual(
          'individual:1',
        );
        expect(type.stringify({}, null)).toEqual('');
        expect(
          type.stringify({}, E.createEntity('individual', 1, null, {state: true})),
        ).toEqual('individual:1');
      });
    });

    describe('ConfigurableEntity', function() {
      let type = C.Types.ConfigurableEntity();
      let props = {entity: {type: {name: 'individual'}}};

      it('parses', function() {
        expect(type.parse(props, '')).toEqual(null);
        expect(type.parse(props, '1')).toEqual(E.createEntity('individual', 1));
        expect(type.parse(props, '1')).toEqual(E.createEntity('individual', 1, null));
      });

      it('stringifies', function() {
        expect(type.stringify({}, null)).toEqual('');
        expect(type.stringify({}, E.createEntity('individual', 1))).toEqual('1');
        expect(type.stringify({}, E.createEntity('individual', 1, null))).toEqual('1');
      });
    });

    describe('ObjectArgument', function() {
      let type = new C.ObjectArgument();

      it('parses', function() {
        expect(type.parse({}, 'a=1,b=~individual:1')).toEqual({
          a: '1',
          b: E.createEntity('individual', 1),
        });
      });

      it('stringifies', function() {
        expect(
          type.stringify({}, {a: 1, b: E.createEntity('individual', 1), c: null}),
        ).toEqual('a=1,b=~individual:1');
      });
    });
  });
});
