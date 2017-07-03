/**
 * @flow
 */

import type {QueryAtom, QueryPipeline, Domain} from '../model/types';
import type {TranslateOptions} from '../fetch/translate';
import type {Chart} from '../chart';

import * as q from '../model/Query';
import * as QueryOperation from '../model/QueryOperation';
import * as SC from '../StateContainer';
import * as Focus from './Focus';
import * as actions from './actions';

/**
 * Represents a bit of info which is restored on undo/redo operations.
 */
type UndoRecord = {
  query: QueryPipeline,
  selected: ?QueryAtom,
  focusedSeq: Focus.Focus,
};

export type ChartSpec = {
  id: string,
  label: ?string,
  chart: Chart,
};

export type Config = {
  api: string,
  domain: Domain,
  translateOptions: TranslateOptions,
};

export type State = {
  config: Config,

  /**
   * Current query.
   */
  query: QueryPipeline,

  /**
   * If current query is invalid (missing some vital parts which result in
   * invalid type).
   */
  queryInvalid: boolean,

  /**
   * If query is being processed by API.
   */
  queryLoading: boolean,

  /**
   * Pointer to the query which has active "add query panel" attached.
   */
  activeQueryPipeline: ?QueryPipeline,

  /**
   * Pointer to the query which has active "edit query panel" attached.
   */
  selected: ?QueryAtom,

  /**
   * Previously selected query.
   *
   * This is used primarly for restoring query selection state.
   */
  prevSelected: ?QueryAtom,

  activeTab: string,

  /**
   * Currently fetched dataset.
   *
   * Note that it could be stale, always check `queryLoading` if query is being
   * processed which will result in a new dataset being fetched.
   */
  data: ?Object,

  /**
   * A list of active charts
   */
  chartList: Array<ChartSpec>,

  /**
   * Show panel.
   */
  showPanel: boolean,

  /**
   * Undo stack.
   */
  undoStack: Array<UndoRecord>,

  /**
   * Redo stack.
   */
  redoStack: Array<UndoRecord>,

  /**
   * Currently focused sequence which is expanded in the datatable.
   */
  focusedSeq: Focus.Focus,
};

export type StateUpdater = SC.StateUpdater<State>;

export type StateContainer = SC.StateContainer<State, typeof actions>;

export type Actions = SC.StateContainerActions<StateContainer>;

export type Params = {
  initialQuery?: ?QueryPipeline,
  initialChartList?: Array<ChartSpec>,
  initialActiveTab?: ?string,
};

export function getInitialState(
  {initialQuery, initialChartList = [], initialActiveTab}: Params,
  config: Config,
): State {
  let query = initialQuery || q.pipeline(q.here);
  query = q.inferType(config.domain, query);
  query = QueryOperation.reconcileNavigation(query);
  query = q.inferType(config.domain, query);

  let focusedSeq = Focus.chooseFocus(query);

  let state: State = {
    config,
    query,
    queryInvalid: false,
    queryLoading: false,
    selected: null,
    prevSelected: null,
    activeTab: initialActiveTab || '__dataset__',
    activeQueryPipeline: null,
    data: null,
    showPanel: true,
    undoStack: [],
    redoStack: [],
    chartList: initialChartList,
    focusedSeq,
  };

  return state;
}

export function createContainerWithInitialState(
  initialState: State,
  config: Config,
  onChange: (state: State, onStateUpdated: (state: State) => *) => *,
) {
  const defaultState = getInitialState({initialQuery: initialState.query}, config);
  const state: State = {
    ...defaultState,
    ...initialState,
    query: defaultState.query,
  };
  // $FlowIssue: ...
  return SC.create(state, actions, onChange);
}

export function createContainer(
  params: Params,
  config: Config,
  onChange: (state: State, onStateUpdated: (state: State) => *) => *,
): StateContainer {
  let initialState = getInitialState(params, config);
  return SC.create(initialState, actions, onChange);
}

export {actions};
