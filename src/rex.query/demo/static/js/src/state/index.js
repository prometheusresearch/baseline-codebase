/**
 * @flow
 */

import type {
  Query,
  Domain,
  QueryPointer
} from '../model';

import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as qo from '../model/QueryOperation';
import * as SC from '../StateContainer';
import * as Focus from './Focus';
import * as actions from './actions';

/**
 * Represents a bit of info which is restored on undo/redo operations.
 */
type UndoRecord = {
  query: Query;
  selected: ?QueryPointer<Query>;
};

export type State = {

  domain: Domain;

  api: string;

  query: Query;

  queryInvalid: boolean;

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

  // normalize query and prepend `here` query
  let {query} = qo.normalize({query: initialQuery || q.here, selected: null});
  if (query.name !== 'here') {
    query = q.pipeline(q.here, query);
  }
  query = q.inferType(domain, query);

  let selected = qp.make(query);
  let focusedSeq = Focus.chooseFocus(query);

  let state: State = {
    domain,
    api,
    query,
    queryInvalid: false,
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
