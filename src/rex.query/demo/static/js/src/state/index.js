/**
 * @flow
 */

import type {
  Query,
  Domain,
  QueryPointer
} from '../model';

import * as q from '../model/Query';
import * as SC from '../StateContainer';
import * as FieldList from './FieldList';
import * as Focus from './Focus';
import * as actions from './actions';

/**
 * Represents a bit of info which is restored on undo/redo operations.
 */
type UndoRecord = {
  query: Query;
  selected: ?QueryPointer<Query>;
  fieldList: FieldList.FieldList;
};

export type State = {

  domain: Domain;

  api: string;

  query: Query;

  queryInvalid: boolean;

  fieldList: FieldList.FieldList;

  selected: ?QueryPointer<Query>;

  data: ?Object;

  dataUpdating: boolean;

  showPanel: boolean;

  showConsole: boolean;

  undoStack: Array<UndoRecord>;

  redoStack: Array<UndoRecord>;

  focusedSeq: Focus.Focus;

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

  let query = q.inferType(domain, initialQuery || q.here);
  let fieldList = FieldList.fromQuery(query);
  let selected = null;
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
    showPanel: true,
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
