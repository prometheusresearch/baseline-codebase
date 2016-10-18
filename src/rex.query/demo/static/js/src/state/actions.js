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
  Context,
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
import * as FieldList from './FieldList';
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
 * Add new field to a list of selected fields.
 */
export function addToFieldList(params: {fieldPath: Array<string>}): StateUpdater {
  const {fieldPath} = params;
  return state => {
    const {fieldList, query} = state;
    let nextFieldList = reconcileFieldList(
      FieldList.merge(fieldList, FieldList.pathToFieldList(fieldPath)),
      query,
      query
    );
    let focusedSeq = reconcileFocus(state.focusedSeq, query, nextFieldList);
    let nextState = {
      ...state,
      fieldList: nextFieldList,
      focusedSeq,
    };
    return [nextState, refetchQuery];
  };
}

/**
 * Remove a field from a list of selected fields.
 */
export function removeFromFieldList(params: {fieldPath: FieldList.FieldPath}): StateUpdater {
  const {fieldPath} = params;
  return state => {
    const {fieldList, query} = state;
    let nextFieldList = FieldList.remove(fieldList, fieldPath);
    let focusedSeq = reconcileFocus(state.focusedSeq, query, nextFieldList);
    let nextState = {
      ...state,
      fieldList: nextFieldList,
      focusedSeq,
    };
    return [nextState, refetchQuery];
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
    if (state.query != null) {
      Fetch.initiateDownload(
        state.api,
        FieldList.addSelect(state.query, state.fieldList)
      );
    }
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
    let {query, selected, fieldList} = undoStack.pop();
    let redoStack = state.redoStack.concat({
      query: state.query,
      selected: state.selected,
      fieldList: state.fieldList,
    });
    let nextState = {...state, query, selected, fieldList, undoStack, redoStack};
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
    let {query, selected, fieldList} = redoStack.pop();
    let undoStack = state.undoStack.concat({
      query: state.query,
      selected: state.selected,
      fieldList: state.fieldList,
    });
    let nextState = {...state, query, selected, fieldList, undoStack, redoStack};
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
export function remove(pointer: QueryPointer<*>): StateUpdater {
  return state => {
    let {query, selected: nextSelected} = qo.removeAt(
      pointer,
      state.selected
    );
    return onQuery(state, query, nextSelected);
  };
}

/**
 * Replace query combinator with a new one at pointer.
 */
export function replace(params: {pointer: QueryPointer<*>, query: Query}): StateUpdater {
  const {query, pointer} = params;
  return state => {
    let {query: nextQuery, selected} = qo.transformAt(
      pointer,
      pointer,
      prevQuery => query
    );
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
      pointer,
      state.selected,
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
      pointer,
      state.selected,
      q.def(name, expression),
      selected => selected
        ? qp.select(selected, ['binding', 'query'])
        : selected
    );
    let nextQuery = q.inferType(state.domain, query);
    let nextFieldList = state.fieldList.concat(FieldList.make(name));
    return onQuery(state, nextQuery, select ? nextSelected : null, nextFieldList);
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
        pointer,
        state.selected,
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
        pointer,
        state.selected,
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
        pointer,
        state.selected,
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
        pointer,
        state.selected,
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
    let {query: nextQuery, selected} = qo.transformAt(
      pointer,
      pointer,
      prevQuery => q.def(name, pointer.query.binding.query)
    );
    let fieldList = state.fieldList.map(field => {
      if (field.name === pointer.query.binding.name) {
        return {...field, name};
      }
      return field;
    });
    return onQuery(state, nextQuery, selected, fieldList);
  };
}

function onQuery(state: State, query: Query, selected: ?QueryPointer<*>, fieldList?: FieldList.FieldList) {
  let nextQuery = q.inferType(state.domain, query);
  let nextFieldList = reconcileFieldList(
    fieldList || state.fieldList,
    nextQuery,
    state.query,
  );
  let nextSelected = null;
  if (selected) {
    nextSelected = qp.rebase(selected, nextQuery);
  }
  let focusedSeq = reconcileFocus(state.focusedSeq, nextQuery, nextFieldList);
  let nextState = {
    ...state,
    query: nextQuery,
    showPanel: state.showPanel,
    selected: nextSelected,
    fieldList: nextFieldList,
    undoStack: state.undoStack.concat({
      query: state.query,
      selected: state.selected,
      fieldList: state.fieldList,
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
  const {query, api, fieldList} = state;
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
    let q = FieldList.addSelect(query, fieldList);
    Fetch.fetch(api, q).then(data => {
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

function reconcileFocus(focusedSeq: Focus.Focus, query, fieldList) {
  let nextFocusedSeq = Focus.chooseFocus(FieldList.addSelect(query, fieldList));
  if (nextFocusedSeq && nextFocusedSeq.length > 0) {
    return nextFocusedSeq;
  } else {
    return focusedSeq;
  }
}

/**
 * Reconcile field list against query.
 *
 * This function removes invalid field list definitions and adds missing ones
 * (for entity types).
 */
function reconcileFieldList(
  fieldList: FieldList.FieldList,
  query: Query,
  prevQuery: Query,
): FieldList.FieldList {
  let type = query.context.type;
  let prevType = prevQuery.context.type;
  if (
    type && prevType &&
    type.name === 'entity' && prevType.name === 'entity' &&
    type.entity !== prevType.entity
  ) {
    return FieldList.fromQuery(query);
  } else if (
    type && prevType &&
    type.name !== prevType.name
  ) {
    return FieldList.fromQuery(query);
  } else {
    let nextFieldList = reconcileFieldListImpl(fieldList, query.context);
    if (nextFieldList.length < 1) {
      return FieldList.fromQuery(query);
    } else {
      return nextFieldList;
    }
  }
}

function reconcileFieldListImpl(
  fieldList: FieldList.FieldList,
  context: Context
): FieldList.FieldList {
  if (fieldList.length === 0) {
    return fieldList;
  }

  let toRemove = [];

  fieldList = fieldList.slice(0);

  for (let i = 0; i < fieldList.length; i++) {
    let field = fieldList[i];
    let type = q.resolveName(context, field.name);

    // remove unknown fields
    if (type === undefined) {
      toRemove.unshift(i);
      continue;

    // type is not defined, leave as-is
    } else if (type === null) {
      continue;
    }

    field = {
      name: field.name,
      children: reconcileFieldListImpl(field.children, {...context, type})
    };

    // check if type is an entity and select its columns if none selected yet
    let baseType = t.atom(type);
    if (baseType.name === 'entity' && field.children.length === 0) {
      field = {
        name: field.name,
        children: FieldList.fromDomainEntity(context.domain.entity[baseType.entity]),
      };
    }

    fieldList[i] = field;
  }
  for (let i = 0; i < toRemove.length; i++) {
    fieldList.splice(toRemove[i], 1);
  }
  return fieldList;
}

