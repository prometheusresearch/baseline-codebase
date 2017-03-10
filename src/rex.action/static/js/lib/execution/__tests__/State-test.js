/**
 * @flow
 */

import * as React from 'react';
import * as S from '../State';
import * as T from '../../Typing';

function createAction(id) {
  return {
    id,
    domain: {},
    element: <div />,
    commands: {},
    contextTypes: {
      input: new T.RecordType({}),
      output: new T.RecordType({}),
    },
  };
}

describe('nextPosition()', function() {
  test('execute {}', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
    };
    const p = {instruction, stack: [], trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { execute }', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'execute',
          action: createAction('actionNext'),
          then: [],
        },
      ],
    };
    const p = {instruction, stack: [], trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { include { execute } }', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'include',
          include: [{type: 'execute', action: createAction('actionNext'), then: []}],
          then: [],
        },
      ],
    };
    const p = {instruction, stack: [], trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { include { include { execute } } }', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'include',
          include: [
            {
              type: 'include',
              include: [{type: 'execute', action: createAction('actionNext'), then: []}],
              then: [],
            },
          ],
          then: [],
        },
      ],
    };
    const p = {instruction, stack: [], trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('include | execute {}', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
    };
    const stack = [
      {
        type: 'include',
        include: [],
        then: [{type: 'execute', action: createAction('actionNext'), then: []}],
      },
    ];
    const p = {instruction, stack, trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('include { execute } -> include {} | execute {}', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
    };
    const stack = [
      {
        type: 'include',
        include: [],
        then: [{type: 'execute', action: createAction('actionNext'), then: []}],
      },
      {
        type: 'include',
        include: [],
        then: [],
      },
    ];
    const p = {instruction, stack, trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('include { execute } -> include { execute } | execute {}', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
    };
    const stack = [
      {
        type: 'include',
        include: [],
        then: [{type: 'execute', action: createAction('WRONG'), then: []}],
      },
      {
        type: 'include',
        include: [],
        then: [{type: 'execute', action: createAction('actionNext'), then: []}],
      },
    ];
    const p = {instruction, stack, trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { repeat (execute) { execute } }', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'repeat',
          repeat: [{type: 'execute', action: createAction('actionRepeat'), then: []}],
          then: [{type: 'execute', action: createAction('actionThen'), then: []}],
        },
      ],
    };
    const stack = [];
    const p = {instruction, stack, trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('repeat (execute) { execute } | execute {}', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
    };
    const stack = [
      {
        type: 'repeat',
        repeat: [{type: 'execute', action: createAction('actionRepeat'), then: []}],
        then: [{type: 'execute', action: createAction('actionThen'), then: []}],
      },
    ];
    const p = {instruction, stack, trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test('include { execute } -> repeat (execute) { execute } | execute {}', function() {
    const instruction: S.IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
    };
    const stack = [
      {
        type: 'include',
        include: [],
        then: [{type: 'execute', action: createAction('WRONG'), then: []}],
      },
      {
        type: 'repeat',
        repeat: [{type: 'execute', action: createAction('actionRepeat'), then: []}],
        then: [{type: 'execute', action: createAction('actionThen'), then: []}],
      },
    ];
    const p = {instruction, stack, trace: [], context: {}, state: {}};
    expect(S.nextPosition(p)).toMatchSnapshot();
  });

  test(
    'prev { current, alternative } => current { replace(alternative with ok = yes) }',
    function() {
      const replace: S.IReplace = {
        type: 'replace',
        traverseBack: 1,
        traverse: [{actionId: 'actionAlternative', contextUpdate: {ok: 'yes'}}],
      };
      const current: S.IExecute = {
        type: 'execute',
        action: createAction('action'),
        then: [replace],
      };
      const alternative: S.IExecute = {
        type: 'execute',
        action: createAction('actionAlternative'),
        then: [],
      };
      const prev: S.IExecute = {
        type: 'execute',
        action: createAction('actionPrev'),
        then: [current, alternative],
      };
      const stack = [];
      const trace = [{instruction: prev, stack, trace: [], state: {}, context: {}}];
      const p = {instruction: current, stack, trace, state: {}, context: {}};
      expect(S.nextPosition(p)).toMatchSnapshot();
    },
  );

  test(
    'prev { current, alternative } => current { replace(alternative with it-is = $should) }',
    function() {
      const replace: S.IReplace = {
        type: 'replace',
        traverseBack: 1,
        traverse: [{actionId: 'actionAlternative', contextUpdate: {'it-is': '$should'}}],
      };
      const current: S.IExecute = {
        type: 'execute',
        action: createAction('action'),
        then: [replace],
      };
      const alternative: S.IExecute = {
        type: 'execute',
        action: createAction('actionAlternative'),
        then: [],
      };
      const prev: S.IExecute = {
        type: 'execute',
        action: createAction('actionPrev'),
        then: [current, alternative],
      };
      const stack = [];
      const trace = [{instruction: prev, stack, trace: [], state: {}, context: {}}];
      const p = {
        instruction: current,
        stack,
        trace,
        state: {},
        context: {should: 'be-transfered'},
      };
      expect(S.nextPosition(p)).toMatchSnapshot();
    },
  );
});
