/**
 * @flow
 */

import type {
  Query,
  QueryPipeline,
  Domain,
  QueryPointer
} from '../model';

import * as q from '../model/Query';
import * as qp from '../model/QueryPointer';
import * as op from '../model/op';
import * as SC from '../StateContainer';
import * as Focus from './Focus';
import * as actions from './actions';

/**
 * Represents a bit of info which is restored on undo/redo operations.
 */
type UndoRecord = {
  query: QueryPipeline;
  selected: ?QueryPointer<Query>;
};

export type State = {

  domain: Domain;

  api: string;

  query: QueryPipeline;

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
  initialQuery?: ?QueryPipeline;
};

export function getInitialState({
  api,
  domain,
  initialQuery
}: Params): State {

  let {query} = op.normalize({
    query: q.inferType(domain, initialQuery || q.pipeline(q.here)),
    selected: null,
  });

  query = q.inferType(domain, query);

  let selected = qp.make(query, ['pipeline', 0]);
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
