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
  QueryPointer,
} from '../model';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as qo from '../model/QueryOperation';
import * as Fetch from '../fetch';
import * as parsing from '../parsing';
import * as Focus from './Focus';

type Position = 'before' | 'after';

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
  pointer: QueryPointer<*>,
  path: Array<string>
}): StateUpdater {
  return state => {
    let withNavigation = infer(state.domain, qo.addNavigation({
      loc: {
        pointer: params.pointer,
        selected: state.selected,
      },
      path: params.path,
    }));

    let type = withNavigation.selected
      ? t.maybeAtom(withNavigation.selected.query.context.type)
      : null;
    if (type && type.name === 'entity') {

      let {query, selected} = qo.transformAt({
        loc: {
          pointer: withNavigation.selected
            ? withNavigation.selected
            : qp.make(withNavigation.query),
          selected: withNavigation.selected,
        },
        transform: (query, selected) => {
          return  qo.growNavigationLocal(query);
        }
      });
      return onQuery(state, query, selected);
    } else {
      return onQuery(state, withNavigation.query, withNavigation.selected);
    }
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
    return {...state, showPanel: false};
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
      return onQuery(state, q.here, null);
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
 * Select a combinator in a query vis panel.
 */
export function select(pointer: ?QueryPointer<*>): StateUpdater {
  return state => {
    return {...state, selected: pointer, showPanel: true};
  };
};

/**
 * Remove a query combinator at pointer.
 */
export function cut(pointer: QueryPointer<*>): StateUpdater {
  return state => {
    let {query, selected: nextSelected} = qo.cutAt({
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
    if (pointer.query.name === 'navigate') {
      let {query, selected: nextSelected} = qo.cutAt({
        loc: {
          pointer,
          selected: state.selected
        }
      });
      return onQuery(state, query, nextSelected);
    } else {
      let {query, selected: nextSelected} = qo.removeAt({
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
export function replace(params: {pointer: QueryPointer<*>, query: Query}): StateUpdater {
  const {query, pointer} = params;
  return state => {
    let {query: nextQuery, selected} = qo.transformAt({
      loc: {pointer, selected: pointer},
      transform: prevQuery => ({query})
    });
    return onQuery(state, nextQuery, selected);
  };
}

/**
 * Append a new navigate combinator at pointer.
 */
export function appendNavigate(
  params: {
    pointer?: QueryPointer<*>;
    path?: Array<string>;
    select?: boolean;
  }
): StateUpdater {
  return insertNavigate('after', params);
}

/**
 * Prepend a new navigate combinator at pointer.
 */
export function prependNavigate(
  params: {
    pointer?: QueryPointer<*>;
    path?: Array<string>;
    select?: boolean;
  }
): StateUpdater {
  return insertNavigate('before', params);
}

function insertNavigate(
  position: Position,
  params: {
    pointer?: QueryPointer<*>;
    path?: Array<string>;
    select?: boolean;
  },
): StateUpdater {
  return state => {
    let {
      pointer = qp.make(state.query),
      path = [''],
      select,
    } = params;

    if (path.length === 0) {
      return state;
    }

    let op = position === 'before' ? qo.insertBefore : qo.insertAfter;
    let {query, selected: nextSelected} = op(
      {pointer, selected: state.selected},
      q.pipeline(...path.map(q.navigate))
    );
    return onQuery(state, query, select ? nextSelected : null);
  };
}

/**
 * Append a new define combinator at pointer.
 */
export function appendDefine(
  params: {
    pointer?: QueryPointer<*>;
    path?: Array<string>;
    select?: boolean;
  }
): StateUpdater {
  return insertDefine('after', params);
}

/**
 * Prepend a new define combinator at pointer.
 */
export function prependDefine(
  params: {
    pointer?: QueryPointer<*>;
    path?: Array<string>;
    select?: boolean;
  }
): StateUpdater {
  return insertDefine('before', params);
}

function insertDefine(
  position: Position,
  params: {
    pointer?: QueryPointer<*>;
    path?: Array<string>;
    select?: boolean;
  }
): StateUpdater {
  return state => {
    let {
      pointer = qp.make(state.query),
      path,
      select,
    } = params;
    let name = getName(
      pointer.query.context.scope,
      path
        ? `${path.join(' ')} query`
        : 'query'
    );
    let expression = path != null
      ? q.pipeline(...path.map(q.navigate))
      : q.navigate('');
    let op = position === 'before' ? qo.insertBefore : qo.insertAfter;
    let {query, selected: nextSelected} = op(
      {pointer, selected: state.selected},
      q.def(name, expression),
      selected => selected
        ? qp.select(selected, ['binding', 'query'])
        : selected
    );
    let nextQuery = q.inferType(state.domain, query);
    return onQuery(state, nextQuery, select ? nextSelected : null);
  };
}

/**
 * Append a new filter combinator at pointer.
 */
export function appendFilter(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    if (pointer) {
      let {
        query,
        selected: nextSelected
      } = qo.insertAfter(
        {pointer, selected: state.selected},
        q.filter(q.or(true))
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.filter(q.or(true));
      return onQuery(state, query, qp.make(query));
    }
  };
}

/**
 * Prepend a new filter combinator at pointer.
 */
export function prependFilter(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    if (pointer) {
      let {
        query,
        selected: nextSelected
      } = qo.insertBefore(
        {pointer, selected: state.selected},
        q.filter(q.or(true))
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.filter(q.or(true))
      return onQuery(state, query, qp.make(query));
    }
  };
}

/**
 * Append a new aggregate combinator at pointer.
 */
export function appendAggregate(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        {pointer, selected: state.selected},
        q.aggregate('count')
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.aggregate('count');
      return onQuery(state, query, qp.make(query));
    }
  };
}

/**
 * Prepend a new aggregate combinator at pointer.
 */
export function prependAggregate(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        {pointer, selected: state.selected},
        q.aggregate('count')
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.aggregate('count');
      return onQuery(state, query, qp.make(query));
    }
  };
}

/**
 * Rename define combinator binding at pointer.
 */
export function renameDefineBinding(params: {pointer: QueryPointer<DefineQuery>, name: string}): StateUpdater {
  const {pointer, name} = params;
  return state => {
    let {query: nextQuery, selected} = qo.transformAt({
      loc: {pointer, selected: pointer},
      transform: prevQuery => ({query: q.def(name, pointer.query.binding.query)})
    });
    return onQuery(state, nextQuery, selected);
  };
}

function onQuery(state: State, query: Query, selected: ?QueryPointer<*>) {
  if (query.name !== 'here') {
    query = q.pipeline(q.here, query);
    if (selected) {
      selected = {
        root: query,
        path: [['pipeline', 1]].concat(selected.path),
        query: selected.query,
      };
    }
  }
  let nextQuery = q.inferType(state.domain, query);
  let nextSelected = selected;
  if (nextSelected) {
    nextSelected = qp.rebase(nextSelected, nextQuery, selectable);
  }
  let focusedSeq = reconcileFocus(state.focusedSeq, nextQuery);
  let nextState = {
    ...state,
    query: nextQuery,
    showPanel: state.showPanel,
    selected: nextSelected,
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

function refetchQuery(state, setState) {
  const {query, api} = state;
  if (query.context.type == null) {
    setState(
      'queryInvalid',
      state => ({...state, dataUpdating: false, queryInvalid: true})
    );
  } else {
    setState(
      'fetchStart',
      state => ({...state, dataUpdating: true, queryInvalid: false})
    );
    Fetch.fetch(api, query).then(data => {
      setState(
        'fetchFinish',
        state => ({...state, data, dataUpdating: false})
      );
    });
  }
}

function getName(scope, prefix = 'Query') {
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
  if (nextFocusedSeq && nextFocusedSeq.length > 0) {
    return nextFocusedSeq;
  } else {
    return focusedSeq;
  }
}

function infer(domain, {query, selected}) {
  query = q.inferType(domain, query);
  if (selected) {
    selected = qp.rebase(selected, query);
  }
  return {query, selected};
}

function selectable(query) {
  return q.transform(query, {
    pipeline: _ => false,
    select: _ => false,
    navigate: query => {
      let type = t.maybeAtom(query.context.type);
      return Boolean(type && type.name === 'entity');
    },
    otherwise: _ => true,
  });
}
