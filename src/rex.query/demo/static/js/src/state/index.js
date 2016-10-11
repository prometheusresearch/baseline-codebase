/**
 * @flow
 */

import type {
  Query,
  DefineQuery,
  Domain,
  DomainEntity,
  QueryPointer
} from '../model';

import invariant from 'invariant';

import * as q from '../model/Query';
import * as t from '../model/Type';
import * as qp from '../model/QueryPointer';
import * as qo from '../model/QueryOperation';
import * as SC from '../StateContainer';
import * as ArrayUtil from '../ArrayUtil';
import * as FieldList from './FieldList';
import * as Focus from './Focus';
import * as actions from './actions';

/**
 * Represents a bit of info which is restored on undo/redo operations.
 */
type UndoRecord = {
  query: ?Query;
  selected: ?QueryPointer<Query>;
  fieldList: Array<string>;
};

export type State = {

  domain: Domain;

  api: string;

  query: ?Query;

  queryInvalid: boolean;

  fieldList: Array<string>;

  selected: ?QueryPointer<Query>;

  data: ?Object;

  dataUpdating: boolean;

  showAddColumnPanel: boolean;

  showConsole: boolean;

  undoStack: Array<UndoRecord>;

  redoStack: Array<UndoRecord>;

  focusedSeq: Array<string>;

};

export type StateUpdater =
  SC.StateUpdater<State>;

export type StateContainer =
  SC.StateContainer<State, typeof actions>;

export type Actions =
  SC.StateContainerActions<StateContainer>;

export type Params = {
  api: string;
  domain: Domain;
  initialQuery?: ?Query;
};

export function getInitialState({
  api,
  domain,
  initialQuery
}: Params): State {

  if (initialQuery == null) {
    let entityName = Object.keys(domain.entity)[0];
    invariant(entityName != null, 'Empty domain');
    initialQuery = q.navigate(entityName);
  }

  let query = q.inferType(domain, initialQuery);
  let fieldList = FieldList.getFieldList(query, true);
  let selected = qp.select(qp.make(query), ['pipeline', 0]);
  let focusedSeq = Focus.chooseFocus(FieldList.addSelect(query, fieldList));

  let state: State = {
    domain,
    api,
    query,
    queryInvalid: false,
    fieldList,
    selected,
    data: null,
    dataUpdating: false,
    showAddColumnPanel: false,
    showConsole: false,
    undoStack: [],
    redoStack: [],
    focusedSeq,
  };

  return state;
}

export {actions};

export function createContainer(
  params: Params,
  onChange: (state: State, onStateUpdated: (state: State) => *) => *
): StateContainer {
  let initialState = getInitialState(params);
  return SC.create(initialState, actions, onChange);
}
