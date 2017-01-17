/**
 * @flow
 */

import type {
  Query,
  QueryPipeline,
  Domain,
  QueryPointer
} from '../model';
import type {
  TranslateOptions
} from '../fetch/translate';

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

  /**
   * Current database domain.
   *
   * TODO: This shouldn't be a part of the state as it doesn't change during
   * QueryBuilder lifecycle.
   */
  domain: Domain;

  /**
   * API being used (an URL).
   *
   * TODO: This shouldn't be a part of the state as it doesn't change during
   * QueryBuilder lifecycle.
   */
  api: string;

  /**
   * Current query.
   */
  query: QueryPipeline;

  /**
   * If current query is invalid (missing some vital parts which result in
   * invalid type).
   */
  queryInvalid: boolean;

  /**
   * If query is being processed by API.
   */
  queryLoading: boolean;

  /**
   * Pointer to the query which has active "add query panel" attached.
   */
  insertAfter: ?QueryPointer<>;

  /**
   * Pointer to the query which has active "edit query panel" attached.
   */
  selected: ?QueryPointer<>;

  /**
   * Previously selected query.
   *
   * This is used primarly for restoring query selection state.
   */
  prevSelected: ?QueryPointer<>;

  /**
   * Currently fetched dataset.
   *
   * Note that it could be stale, always check `queryLoading` if query is being
   * processed which will result in a new dataset being fetched.
   */
  data: ?Object;

  /**
   * Show panel.
   */
  showPanel: boolean;

  /**
   * Undo stack.
   */
  undoStack: Array<UndoRecord>;

  /**
   * Redo stack.
   */
  redoStack: Array<UndoRecord>;

  /**
   * Currently focused sequence which is expanded in the datatable.
   */
  focusedSeq: Focus.Focus;

  /**
   * Query translation options.
   *
   * We put it in state because we probably will make it configurable through
   * the UI.
   */
  translateOptions: TranslateOptions;
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
  translateOptions: TranslateOptions;
};

export function getInitialState({
  api,
  domain,
  initialQuery,
  translateOptions,
}: Params): State {

  let query = initialQuery || q.pipeline(q.here);
  query = q.inferType(domain, query);
  query = op.reconcileNavigation(query);
  query = op.normalize({
    query: q.inferType(domain, query),
    selected: null,
  }).query;
  query = q.inferType(domain, query);

  let insertAfter = initialQuery == null
    ? qp.make(query, ['pipeline', 0])
    : null;

  let selected = null;

  let focusedSeq = Focus.chooseFocus(query);

  let state: State = {
    domain,
    api,
    query,
    queryInvalid: false,
    queryLoading: false,
    selected,
    prevSelected: null,
    insertAfter,
    data: null,
    showPanel: true,
    undoStack: [],
    redoStack: [],
    focusedSeq,
    translateOptions,
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
