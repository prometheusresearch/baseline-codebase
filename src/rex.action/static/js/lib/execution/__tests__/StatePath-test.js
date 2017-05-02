/**
 * @flow
 */

import * as React from 'react';
import * as SP from '../StatePath';
import * as S from '../State';
import * as C from '../Command';
import * as T from '../../Typing';

describe('StatePath.fromPath()/toPath()', function() {
  const contextTypes = {
    input: new T.RecordType({}),
    output: new T.RecordType({}),
  };
  const setValueCommand = new C.Command(
    function(props, context, value) {
      return {...context, value};
    },
    'default',
    [C.Types.Value()],
  );
  function createAction({id, commands}) {
    return {
      id,
      domain: {},
      contextTypes,
      element: <div />,
      commands,
    };
  }
  const instruction: S.Instruction[] = [
    {
      type: 'execute',
      action: createAction({id: 'one', commands: {}}),
      then: [],
    },
    {
      type: 'execute',
      action: createAction({id: 'two', commands: {}}),
      then: [
        {
          type: 'execute',
          action: createAction({id: 'three', commands: {}}),
          then: [],
        },
      ],
    },
    {
      type: 'execute',
      action: createAction({
        id: 'with-default-command',
        commands: {
          default: setValueCommand,
        },
      }),
      then: [],
    },
    {
      type: 'execute',
      action: createAction({
        id: 'with-named-command',
        commands: {
          named: setValueCommand,
        },
      }),
      then: [],
    },
  ];
  const config = {instruction, context: {}};

  test('', function() {
    const state = SP.fromPath('', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/one');
  });

  test('/', function() {
    const state = SP.fromPath('/', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/one');
  });

  test('/one', function() {
    const state = SP.fromPath('/one', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/one');
  });

  test('/two', function() {
    const state = SP.fromPath('/two', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/two');
  });

  test('/two/three', function() {
    const state = SP.fromPath('/two/three', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/two/three');
  });

  test('/with-default-command', function() {
    const state = SP.fromPath('/with-default-command', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/with-default-command');
  });

  test('/with-default-command[42]', function() {
    const state = SP.fromPath('/with-default-command[42]', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/with-default-command[42]');
  });

  test('/with-named-command', function() {
    const state = SP.fromPath('/with-named-command', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/with-named-command');
  });

  test('/with-named-command.named[32]', function() {
    const state = SP.fromPath('/with-named-command.named[32]', config);
    expect(state.position).toMatchSnapshot();
    const path = SP.toPath(state);
    expect(path).toBe('/with-named-command.named[32]');
  });
});
