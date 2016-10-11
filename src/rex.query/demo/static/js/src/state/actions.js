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

import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as qo from '../model/QueryOperation';
import * as Fetch from '../fetch';
import * as parsing from '../parsing';
import * as FieldList from './FieldList';
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
 * Add new field to a list of selected fields.
 */
export function addToFieldList(params: {field: string}): StateUpdater {
  const {field} = params;
  return state => {
    if (state.query == null) {
      return state;
    }
    const {fieldList, query} = state;
    let nextFieldList = fieldList.concat(field);
    let focusedSeq = Focus.chooseFocus(FieldList.addSelect(query, nextFieldList));
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
export function removeFromFieldList(params: {field: string}): StateUpdater {
  const {field} = params;
  return state => {
    if (state.query == null) {
      return state;
    }
    const {fieldList, query} = state;
    let idx = fieldList.indexOf(field);
    if (idx === -1) {
      return state;
    }
    let nextFieldList = fieldList.slice(0);
    nextFieldList.splice(idx, 1);
    let focusedSeq = Focus.chooseFocus(FieldList.addSelect(query, nextFieldList));
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
 * Show field selection panel.
 */
export function showAddColumnPanel(): StateUpdater {
  return state => {
    return {
      ...state,
      showAddColumnPanel: true,
      selected: null,
    };
  };
}

/**
 * Hide field selection panel.
 */
export function hideAddColumnPanel(): StateUpdater {
  return state => {
    return {...state, showAddColumnPanel: false};
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
      return this.onQuery(state, null, null);
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
    return {...state, selected: pointer, showAddColumnPanel: false};
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
export function appendNavigate(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        pointer,
        state.selected,
        q.navigate('')
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.navigate('');
      return onQuery(state, query, qp.make(query));
    }
  };
}

/**
 * Prepend a new navigate combinator at pointer.
 */
export function prependNavigate(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertBefore(
        pointer,
        state.selected,
        q.navigate('')
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.navigate('');
      return onQuery(state, query, qp.make(query));
    }
  };
}

/**
 * Append a new define combinator at pointer.
 */
export function appendDefine(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    // TODO: need to allocate unique name
    let name = 'Query';
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertAfter(
        pointer,
        state.selected,
        q.def(name, q.navigate(''))
      );
      nextSelected = qp.select(nextSelected, ['binding', 'query']);
      let fieldList = state.fieldList.concat(name);
      return onQuery(state, query, nextSelected, fieldList);
    } else {
      let query = q.def(name, q.navigate(''))
      let selected = qp.select(qp.make(query), ['binding', 'query']);
      return onQuery(state, query, selected);
    }
  };
}

/**
 * Prepend a new define combinator at pointer.
 */
export function prependDefine(params: {pointer: ?QueryPointer<*>}): StateUpdater {
  let {pointer} = params;
  return state => {
    pointer = pointer ? pointer : state.query ? qp.make(state.query) : null;
    // TODO: need to allocate unique name
    let name = 'Query';
    if (pointer) {
      let {query, selected: nextSelected} = qo.insertBefore(
        pointer,
        state.selected,
        q.def(name, q.navigate(''))
      );
      nextSelected = qp.select(nextSelected, ['binding', 'query']);
      let fieldList = state.fieldList.concat(name);
      return onQuery(state, query, nextSelected, fieldList);
    } else {
      let query = q.def(name, q.navigate(''))
      let selected = qp.select(qp.make(query), ['binding', 'query']);
      return onQuery(state, query, selected);
    }
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
        q.filter(q.navigate('true'))
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.filter(q.navigate('true'))
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
        q.filter(q.navigate('true'))
      );
      return onQuery(state, query, nextSelected);
    } else {
      let query = q.filter(q.navigate('true'))
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
    let fieldList = state.fieldList.map(field =>
      field === pointer.query.binding.name ? name : field);
    return onQuery(state, nextQuery, selected, fieldList);
  };
}

function onQuery(state: State, query: ?Query, selected: ?QueryPointer<*>, fieldList?: Array<string>) {
  if (query == null) {
    return {
      ...state,
      query,
      selected: null,
      showAddColumnPanel: false,
      undoStack: state.undoStack.concat({
        query: state.query,
        selected: state.selected,
        fieldList: state.fieldList,
      }),
      redoStack: [],
      focusedSeq: [],
    };
  } else {
    let nextQuery = q.inferType(state.domain, query);
    fieldList = FieldList.updateFieldList(
      fieldList || state.fieldList,
      // $FlowIssue: ...
      state.query,
      nextQuery,
    );
    let nextSelected = null;
    if (selected) {
      nextSelected = qp.rebase(selected, nextQuery);
    }
    let focusedSeq = Focus.chooseFocus(FieldList.addSelect(nextQuery, fieldList));
    let nextState = {
      ...state,
      query: nextQuery,
      selected: nextSelected,
      fieldList: fieldList,
      showAddColumnPanel: false,
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
}

function refetchQuery(state, setState) {
  const {query, api, fieldList} = state;
  if (query != null) {
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
}
