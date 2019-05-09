/**
 * @flow
 */

import type {IExecute, IReplace} from '../types';

import * as React from 'react';
import * as P from '../Position';
import * as T from '../Type';
import * as I from '../Instruction';

function createAction(id) {
  return {
    id,
    name: id,
    domain: {},
    element: <div />,
    commands: {},
    contextTypes: {
      input: new T.RecordType({}),
      output: new T.RecordType({}),
    },
  };
}

const startPosition = {
  type: 'start-position',
  instruction: {type: 'start', then: [], parent: null},
  context: {},
};

describe('nextPosition()', function() {
  test('execute {}', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
      parent: null,
    };
    const p = {
      type: 'position',
      instruction,
      stack: [],
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { execute }', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'execute',
          action: createAction('actionNext'),
          then: [],
          parent: null,
        },
      ],
      parent: null,
    };
    const p = {
      type: 'position',
      instruction,
      stack: [],
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { include { execute } }', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'include',
          name: 'include-actionNext',
          include: {
            type: 'start',
            then: [
              {
                type: 'execute',
                action: createAction('actionNext'),
                then: [],
                parent: null,
              },
            ],
            parent: null,
          },
          then: [],
          parent: null,
        },
      ],
      parent: null,
    };
    const p = {
      type: 'position',
      instruction,
      stack: [],
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { include { include { execute } } }', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'include',
          name: 'include-include-actionNext',
          include: {
            type: 'start',
            then: [
              {
                type: 'include',
                name: 'include-actionNext',
                include: {
                  type: 'start',
                  then: [
                    {
                      type: 'execute',
                      action: createAction('actionNext'),
                      then: [],
                      parent: null,
                    },
                  ],
                  parent: null,
                },
                then: [],
                parent: null,
              },
            ],
            parent: null,
          },
          then: [],
          parent: null,
        },
      ],
      parent: null,
    };
    const p = {
      type: 'position',
      instruction,
      stack: [],
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('include | execute {}', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
      parent: null,
    };
    const stack = [
      {
        type: 'include',
        name: 'include-actionNext',
        include: {type: 'start', then: [], parent: null},
        then: [
          {type: 'execute', action: createAction('actionNext'), then: [], parent: null},
        ],
        parent: null,
      },
    ];
    const p = {
      type: 'position',
      instruction,
      stack,
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('include { execute } -> include {} | execute {}', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
      parent: null,
    };
    const stack = [
      {
        type: 'include',
        name: 'include-actionNext',
        include: {type: 'start', then: [], parent: null},
        then: [
          {type: 'execute', action: createAction('actionNext'), then: [], parent: null},
        ],
        parent: null,
      },
      {
        type: 'include',
        name: 'include-empty',
        include: {type: 'start', then: [], parent: null},
        then: [],
        parent: null,
      },
    ];
    const p = {
      type: 'position',
      instruction,
      stack,
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('include { execute } -> include { execute } | execute {}', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
      parent: null,
    };
    const stack = [
      {
        type: 'include',
        name: 'include-WRONG',
        include: {type: 'start', then: [], parent: null},
        then: [{type: 'execute', action: createAction('WRONG'), then: [], parent: null}],
        parent: null,
      },
      {
        type: 'include',
        name: 'include-actionNext',
        include: {type: 'start', then: [], parent: null},
        then: [
          {type: 'execute', action: createAction('actionNext'), then: [], parent: null},
        ],
        parent: null,
      },
    ];
    const p = {
      type: 'position',
      instruction,
      stack,
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('execute { repeat (execute) { execute } }', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [
        {
          type: 'repeat',
          repeat: [
            {
              type: 'execute',
              action: createAction('actionRepeat'),
              then: [],
              parent: null,
            },
          ],
          then: [
            {type: 'execute', action: createAction('actionThen'), then: [], parent: null},
          ],
          parent: null,
        },
      ],
      parent: null,
    };
    const stack = [];
    const p = {
      type: 'position',
      instruction,
      stack,
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('repeat (execute) { execute } | execute {}', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
      parent: null,
    };
    const stack = [
      {
        type: 'repeat',
        repeat: [
          {type: 'execute', action: createAction('actionRepeat'), then: [], parent: null},
        ],
        then: [
          {type: 'execute', action: createAction('actionThen'), then: [], parent: null},
        ],
        parent: null,
      },
    ];
    const p = {
      type: 'position',
      instruction,
      stack,
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('include { execute } -> repeat (execute) { execute } | execute {}', function() {
    const instruction: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [],
      parent: null,
    };
    const stack = [
      {
        type: 'include',
        name: 'include-WRONG',
        include: {type: 'start', then: [], parent: null},
        then: [{type: 'execute', action: createAction('WRONG'), then: [], parent: null}],
        parent: null,
      },
      {
        type: 'repeat',
        repeat: [
          {type: 'execute', action: createAction('actionRepeat'), then: [], parent: null},
        ],
        then: [
          {type: 'execute', action: createAction('actionThen'), then: [], parent: null},
        ],
        parent: null,
      },
    ];
    const p = {
      type: 'position',
      instruction,
      stack,
      prev: startPosition,
      context: {},
      state: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('root { current, alternative } => current { replace(alternative with ok = yes) }', function() {
    const replace: IReplace = {
      type: 'replace',
      traverseBack: 1,
      traverse: [{actionName: 'actionAlternative', contextUpdate: {ok: 'yes'}}],
      parent: null,
    };
    const current: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [replace],
      parent: null,
    };
    const alternative: IExecute = {
      type: 'execute',
      action: createAction('actionAlternative'),
      then: [],
      parent: null,
    };
    const root: IExecute = {
      type: 'execute',
      action: createAction('actionPrev'),
      then: [current, alternative],
      parent: null,
    };
    assignParent(root);
    const stack = [];
    const prevPos = {
      type: 'position',
      instruction: root,
      stack,
      prev: startPosition,
      state: {},
      context: {},
    };
    const p = {
      type: 'position',
      instruction: current,
      stack,
      prev: prevPos,
      state: {},
      context: {},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });

  test('root { current, alternative } => current { replace(alternative with it-is = $should) }', function() {
    const replace: IReplace = {
      type: 'replace',
      traverseBack: 1,
      traverse: [{actionName: 'actionAlternative', contextUpdate: {'it-is': '$should'}}],
      parent: null,
    };
    const current: IExecute = {
      type: 'execute',
      action: createAction('action'),
      then: [replace],
      parent: null,
    };
    const alternative: IExecute = {
      type: 'execute',
      action: createAction('actionAlternative'),
      then: [],
      parent: null,
    };
    const root: IExecute = {
      type: 'execute',
      action: createAction('actionPrev'),
      then: [current, alternative],
      parent: null,
    };
    assignParent(root);
    const stack = [];
    const prevPos = {
      type: 'position',
      instruction: root,
      stack,
      prev: startPosition,
      state: {},
      context: {},
    };
    const p = {
      type: 'position',
      instruction: current,
      stack,
      prev: prevPos,
      state: {},
      context: {should: 'be-transfered'},
    };
    expect(P.nextPosition(p)).toMatchSnapshot();
  });
});

function assignParent(instruction) {
  I.visit(instruction, (instruction, parent) => {
    if (parent != null) {
      instruction.parent = parent;
    }
  });
}
