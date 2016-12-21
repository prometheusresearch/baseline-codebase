/**
 * This module exports all available actions for a query builder.
 *
 * @flow
 */

import type {
  State,
  StateUpdater,
} from './index';

import type {
  DefineQuery,
  Query,
  QueryPipeline,
  QueryPointer,
} from '../model';

import invariant from 'invariant';
import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as op from '../model/op';
import * as Fetch from '../fetch';
import * as parsing from '../parsing';
import * as Focus from './Focus';

/**
 * Initialize query buiulder.
 */
export function init(): StateUpdater {
  return state => {
    return [state, refetchQuery];
  };
}

/**
 * Navigate.
 */
export function navigate(params: {
  pointer: QueryPointer<Query>,
  path: Array<string>,
}): StateUpdater {

  return state => {
    let pointer = qp.rebase(params.pointer, state.query);
    let loc = {pointer, selected: state.selected};
    let add = null;
    let type = q.resolvePath(
      qp.selectLast(pointer).query.context.prev,
      params.path
    );
    if (type.card === 'seq' && type.name === 'record' && type.entity != null) {
      add = q.aggregate('count');
    }
    let {query} = op.growNavigation({
      loc,
      path: params.path,
      add: add
    });
    return onQuery(state, query, state.selected);
  };
}

/**
 * Put a focus on a sequence in a datatable.
 */
export function focusOnSeq(params: {focusedSeq: Focus.Focus}): StateUpdater {
  const {focusedSeq} = params;
  return state => {
    return {...state, focusedSeq};
  };
}

/**
 * Initiate export procedure.
 */
export function exportDataset(): StateUpdater {
  return state => {
    Fetch.initiateDownload(state.api, state.query);
    return state;
  };
}

/**
 * Show column picker.
 */
export function showSelect(): StateUpdater {
  return state => {
    return {...state, showPanel: true, selected: null};
  };
}

/**
 * Show field selection panel.
 */
export function showPanel(): StateUpdater {
  return state => {
    return {...state, showPanel: true};
  };
}

/**
 * Hide field selection panel.
 */
export function hidePanel(): StateUpdater {
  return state => {
    return {
      ...state,
      showPanel: state.insertAfter != null && state.prevSelected
        ? true
        : false,
      insertAfter: null,
      selected: state.insertAfter != null
        ? state.prevSelected
        : null,
      prevSelected: null,
    };
  };
}

/**
 * Show console.
 */
export function showConsole(): StateUpdater {
  return state => {
    return {...state, showConsole: true};
  };
}

/**
 * Hide console.
 */
export function hideConsole(): StateUpdater {
  return state => {
    return {...state, showConsole: false};
  };
}

/**
 * Input new text in a console.
 */
export function consoleInput(params: {value: string}): StateUpdater {
  const {value} = params;
  return state => {
    if (value === '') {
      return onQuery(state, q.pipeline(q.here), null);
    } else {
      let node;
      try {
        node = parsing.parse(value);
      } catch (err) {
        if (err instanceof parsing.SyntaxError) {
          return state;
        } else {
          throw err;
        }
      }
      let query = parsing.toQuery(this.props.domain, node);
      return onQuery(state, query, null);
    }
  };
}

/**
 * Undo.
 */
export function undo(): StateUpdater {
  return state => {
    let undoStack = state.undoStack.slice(0);
    let {query, selected} = undoStack.pop();
    let redoStack = state.redoStack.concat({
      query: state.query,
      selected: state.selected,
    });
    let nextState = {...state, query, selected, undoStack, redoStack};
    return [
      nextState,
      refetchQuery,
    ];
  };
}

/**
 * Redo.
 */
export function redo(): StateUpdater {
  return state => {
    let redoStack = state.redoStack.slice(0);
    let {query, selected} = redoStack.pop();
    let undoStack = state.undoStack.concat({
      query: state.query,
      selected: state.selected,
    });
    let nextState = {...state, query, selected, undoStack, redoStack};
    return [
      nextState,
      refetchQuery
    ];
  }
};

/**
 * Initiate new query combinator insertion.
 */
export function insertAfter(pointer: ?QueryPointer<*>): StateUpdater {
  return state => {
    return {
      ...state,
      insertAfter: pointer,
      selected: null,
      prevSelected: state.selected,
      showPanel: true
    };
  };
};

export function insertAfterClose(): StateUpdater {
  return state => {
    return {
      ...state,
      insertAfter: null,
      prevSelected: null,
      selected: state.prevSelected,
    };
  };
};

/**
 * Select a combinator in a query vis panel.
 */
export function select(pointer: ?QueryPointer<*>): StateUpdater {
  return state => {
    return {
      ...state,
      selected: pointer,
      showPanel: true,
      insertAfter: null,
    };
  };
};

/**
 * Remove a query combinator at pointer.
 */
export function cut(pointer: QueryPointer<*>): StateUpdater {
  return state => {
    let {query, selected: nextSelected} = op.cutAt({
      loc: {
        pointer,
        selected: state.selected
      }
    });
    return onQuery(state, query, nextSelected);
  };
}

/**
 * Remove a query combinator at pointer.
 */
export function remove(pointer: QueryPointer<*>): StateUpdater {
  return state => {
    pointer = qp.rebase(pointer, state.query);
    if (pointer.query.name === 'navigate') {
      let {query, selected: nextSelected} = op.cutAt({
        loc: {
          pointer,
          selected: state.selected
        }
      });
      return onQuery(state, query, nextSelected);
    } else {
      let {query, selected: nextSelected} = op.removeAt({
        pointer,
        selected: state.selected
      });
      return onQuery(state, query, nextSelected);
    }
  };
}

/**
 * Replace query combinator with a new one at pointer.
 */
export function replace(
  params: {
    pointer: QueryPointer<*>;
    query: Query
  }): StateUpdater {
  return state => {
    let {query, pointer} = params;
    pointer = qp.rebase(pointer, state.query);
    let {query: nextQuery} = op.transformAt({
      loc: {pointer, selected: pointer},
      transform: prevQuery => ({query})
    });
    return onQuery(state, nextQuery, state.selected);
  };
}

/**
 * Update group query with new column list.
 */
export function setGroupByPath(
  params: {
    pointer: QueryPointer<q.GroupQuery>,
    byPath: Array<string>,
  }
): StateUpdater {
  return state => {
    let {byPath, pointer} = params;
    pointer = qp.rebase(pointer, state.query);
    let {query} = pointer;

    let prevType = query.context.prev.type;
    invariant(
      prevType && prevType.name === 'record' && prevType.entity != null,
      'Invalid type info'
    );

    query = op.transformAt({
      loc: {pointer, selected: null},
      transform: _ => {
        return {
          query: {
            name: 'group',
            byPath: byPath,
            context: query.context,
          }
        };
      }
    }).query;
    query = q.inferType(state.domain, query);
    query = op.growNavigation({
      loc: {pointer: qp.rebase(pointer, query), selected: null},
      path: [prevType.entity],
      add: q.aggregate('count'),
    }).query;
    return onQuery(state, query, state.selected);
  };
}

/**
 * Append a new navigate combinator at pointer.
 */
export function appendNavigate(
  params: {
    pointer?: QueryPointer<*>;
    path?: Array<string>;
  }
): StateUpdater {
  return state => {
    let {
      pointer = qp.make(state.query),
      path = [''],
    } = params;
    if (path.length === 0) {
      return state;
    }
    let {query} = op.insertAfter(
      {pointer, selected: state.selected},
      q.pipeline(...path.map(q.use))
    );
    return onQuery(state, query, state.selected || state.prevSelected);
  };
}

/**
 * Append a new define combinator at pointer.
 */
export function appendDefine(
  params: {
    pointer: QueryPointer<*>;
    path?: Array<string>;
    select?: boolean;
  }
): StateUpdater {
  return state => {
    let {
      path,
      select,
    } = params;
    let pointer = qp.rebase(params.pointer, state.query);
    let name = generateQueryID(
      pointer.query.context.scope,
      path
        ? `${path.join(' ')} query`
        : 'query'
    );
    let expression = path != null
      ? q.pipeline(...path.map(q.use))
      : q.pipeline(q.use(''));
    let {query, selected} = op.insertAfter(
      {pointer, selected: state.selected},
      q.def(name, expression),
    );
    query = q.inferType(state.domain, query);
    let {query: nextQuery} = op.growNavigation({
      loc: {pointer: qp.rebase(pointer, query), selected: null},
      path: [name],
    });
    return onQuery(state, nextQuery, select ? selected : null, null);
  };
}

/**
 * Append a new filter combinator at pointer.
 */
export function appendFilter(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  return state => {
    let pointer = params.pointer
      ? qp.rebase(params.pointer, state.query)
      : qp.make(state.query);
    let {
      query,
      selected: nextSelected
    } = op.insertAfter(
      {pointer, selected: state.selected},
      q.filter(q.or(q.value(true)))
    );
    return onQuery(state, query, nextSelected);
  };
}

/**
 * Append a new filter combinator at pointer.
 */
export function appendGroup(params: {pointer: QueryPointer<*>}): StateUpdater {
  return state => {
    let pointer = qp.rebase(params.pointer, state.query);
    let {
      query,
      selected: nextSelected
    } = op.insertAfter(
      {pointer, selected: state.selected},
      q.group([]),
    );
    return onQuery(state, query, nextSelected);
  };
}

/**
 * Append a new aggregate combinator at pointer.
 */
export function appendAggregate(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  return state => {
    let pointer = params.pointer
      ? qp.rebase(params.pointer, state.query)
      : qp.make(state.query);
    let {query, selected} = op.insertAfter(
      {pointer, selected: state.selected},
      q.aggregate('count')
    );
    return onQuery(state, query, selected);
  };
}

/**
 * Append a new aggregate combinator at pointer.
 */
export function appendNavigateAndAggregate(params: {
  pointer: QueryPointer<QueryPipeline>;
  path: Array<string>;
  aggregate: t.DomainAggregate;
}): StateUpdater {
  return state => {
    let {path, aggregate, pointer} = params;
    pointer = qp.rebase(pointer, state.query)
    let {query} = op.transformAt({
      loc: {pointer, selected: state.selected},
      transform: query => {
        invariant(
          query.name === 'pipeline',
          'Expected "pipeline" query'
        );
        let pipeline = query.pipeline.slice(0);
        if (pipeline[pipeline.length - 1].name === 'select') {
          pipeline.pop();
        }
        if (path.length) {
          pipeline = pipeline.concat(path.map(p => q.use(p)));
        }
        pipeline.push(q.aggregate(aggregate.name));
        return {
          query: {
            name: 'pipeline',
            pipeline,
            context: query.context,
          }
        };
      }
    });
    return onQuery(state, query, state.prevSelected, null);
  };
}

/**
 * Append a new aggregate combinator at pointer.
 */
export function appendDefineAndAggregate(params: {
  pointer: QueryPointer<QueryPipeline>;
  path: Array<string>;
  aggregate: t.DomainAggregate;
}): StateUpdater {
  return state => {
    let {path, aggregate, pointer} = params;
    let name = generateQueryID(pointer.query.context.scope, params.path.join(' ') + ' Query');
    pointer = qp.rebase(pointer, state.query)
    let {query} = op.transformAt({
      loc: {pointer, selected: state.selected},
      transform: query => {
        invariant(
          query.name === 'pipeline',
          'Expected "pipeline" query'
        );
        let pipeline = query.pipeline.slice(0);
        let select = null;
        if (pipeline[pipeline.length - 1].name === 'select') {
          select = pipeline.pop();
        }
        let innerPipeline = [];
        if (path.length > 0) {
          innerPipeline = innerPipeline.concat(path.map(p => q.use(p)));
        } else {
          innerPipeline.push(q.here);
        }
        innerPipeline.push(q.aggregate(aggregate.name));
        pipeline.push(
          q.def(
            name,
            q.pipeline(...innerPipeline),
          )
        );
        if (select) {
          pipeline.push(select);
        }
        return {
          query: {
            name: 'pipeline',
            pipeline,
            context: query.context,
          }
        };
      }
    });
    pointer = qp.rebase(pointer, query);
    let selected = qp.selectFindLast(
      ((pointer: any): QueryPointer<QueryPipeline>),
      query => query.name === 'define'
    );
    if (selected) {
      selected = qp.select(
        selected,
        ['binding', 'query'],
        ['pipeline', params.path.length],
      );
    }
    query = op.growNavigation({
      loc: {pointer, selected: state.selected},
      path: [name],
    }).query;
    return onQuery(state, query, selected || state.prevSelected, null);
  };
}

/**
 * Rename define combinator binding at pointer.
 */
export function renameDefineBinding(
  params: {
    pointer: QueryPointer<DefineQuery>;
    name: string
  }
): StateUpdater {
  return state => {
    const pointer = qp.rebase(params.pointer, state.query);
    const prevName = params.pointer.query.binding.name;
    const nextName = params.name;
    let {query} = op.transformAt({
      loc: {pointer, selected: pointer},
      transform: prevQuery => {
        invariant(
          prevQuery.name === 'define',
          'Expected "define" query'
        );
        return {query: q.def(nextName, prevQuery.binding.query)};
      }
    });
    let renameNavigation = query => {
      if (query.path === prevName) {
        query = q.use(nextName);
      }
      return query;
    };
    query = q.mapQueryWithTransform(query, {
      navigate: renameNavigation,
      select: query => {
        let select = {};
        for (let k in query.select) {
          if (!query.select.hasOwnProperty(k)) {
            continue;
          }
          if (k === prevName) {
            select[nextName] = query.select[prevName];
          } else {
            select[k] = query.select[k];
          }
        }
        return {name: 'select', select, context: query.context};
      },
      filter: query => {
        let predicate = q.mapExpressionWithTransform(query.predicate, {
          navigate: renameNavigation,
        });
        return {name: 'filter', predicate, context: query.context};
      },
      otherwise: query => query,
    });
    return onQuery(state, ((query: any): QueryPipeline), state.selected);
  };
}

function onQuery(
  state: State,
  query: QueryPipeline,
  selected: ?QueryPointer<*>,
  insertAfter?: ?QueryPointer<> = state.insertAfter
) {
  query = q.inferType(state.domain, query);
  query = op.reconcileNavigation(query);
  query = q.inferType(state.domain, query);
  if (selected && selected.path.length > 0) {
    selected = qp.rebase(selected, query, selectable);
  } else {
    selected = qp.pointer(query, ['pipeline', 0]);
  }
  let showPanel = state.showPanel;
  if (insertAfter != null && !qp.is(selected, state.selected)) {
    insertAfter = null;
    showPanel = false;
  }
  if (insertAfter != null) {
    insertAfter = qp.rebase(insertAfter, query);
  }
  if (insertAfter == null && state.insertAfter != null) {
    showPanel = false;
  }
  if (!qp.is(state.selected, selected)) {
    showPanel = true;
  }
  let focusedSeq = reconcileFocus(state.focusedSeq, query);
  let nextState = {
    ...state,
    query,
    selected,
    insertAfter,
    showPanel: showPanel,
    undoStack: state.undoStack.concat({
      query: state.query,
      selected: state.selected,
    }),
    redoStack: [],
    focusedSeq,
  };
  return [
    nextState,
    refetchQuery
  ];
}

// FIXME: we need better sync mechanism, this is just hacky.
let refetchIndex = 0;

function refetchQuery(state, setState) {
  const {query, api} = state;
  refetchIndex += 1;
  const currentRefetchIndex = refetchIndex;
  Promise.resolve().then(_ => {
    if (query.context.type.name === 'invalid') {
      setState(
        'queryInvalid',
        state => ({...state, queryLoading: false, queryInvalid: true})
      );
    } else {
      setState(
        'fetchStart',
        state => ({...state, queryLoading: true, queryInvalid: false})
      );
      Fetch.fetch(api, query).then(data => {
        if (refetchIndex === currentRefetchIndex) {
          setState(
            'fetchFinish',
            state => ({...state, data, queryLoading: false})
          );
        }
      });
    }
  });
}

function generateQueryID(scope, prefix = 'Query') {
  if (scope[prefix] == null) {
    return prefix;
  }
  let c = 1;
  while (scope[prefix + ' ' + c] != null) {
    c += 1;
  }
  return prefix + ' ' + c;
}

function reconcileFocus(focusedSeq: Focus.Focus, query) {
  let nextFocusedSeq = Focus.chooseFocus(query);
  return nextFocusedSeq;
}

function selectable(query) {
  const type = query.context.type;
  return (
    type.name === 'invalid'    ||
    type.name === 'record'     ||
    type.name === 'void'       ||

    query.name === 'aggregate' ||
    query.name === 'define'
  );
}