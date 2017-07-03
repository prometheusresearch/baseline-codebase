// @flow

import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactUI from '@prometheusresearch/react-ui';
import {QueryBuilderApp, serializeQuery, deserializeQuery} from 'rex-query/api';

const LOCAL_STORAGE_KEY = '__rex_query_state__';

let _currentState = getStateSnapshot();

function getStateSnapshot() {
  const data = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data != null) {
    try {
      const state = JSON.parse(data);
      return {
        ...state,
        query: deserializeQuery(state.query),
        selected: state.selected ? deserializeQuery(state.selected) : state.selected,
        activeQueryPipeline: state.activeQueryPipeline
          ? deserializeQuery(state.activeQueryPipeline)
          : state.activeQueryPipeline,
      };
    } catch (_err) {
      return null;
    }
  } else {
    return null;
  }
}

function onState(state) {
  _currentState = state;
}

function snapshotCurrentState() {
  if (_currentState != null) {
    const data = {
      ..._currentState,
      query: serializeQuery(_currentState.query),
      undoStack: [],
      redoStack: [],
      activeQueryPipeline: _currentState.activeQueryPipeline
        ? serializeQuery(_currentState.activeQueryPipeline)
        : null,
      selected: _currentState.selected ? serializeQuery(_currentState.selected) : null,
      prevSelected: null,
    };
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}

function restoreStateSnapshot() {
  const state = getStateSnapshot();
  if (state != null && app.queryBuilder) {
    _currentState = state;
    app.queryBuilder.actions.setState(state);
  }
}

function resetSnapshot() {
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

function Toolbar() {
  return (
    <div>
      <ReactUI.QuietButton onClick={snapshotCurrentState} size="small">
        Snapshot current state
      </ReactUI.QuietButton>
      <ReactUI.QuietButton
        onClick={restoreStateSnapshot}
        disabled={window.localStorage.getItem(LOCAL_STORAGE_KEY) == null}
        size="small">
        Restore state snapshot
      </ReactUI.QuietButton>
      <ReactUI.QuietButton
        onClick={resetSnapshot}
        disabled={window.localStorage.getItem(LOCAL_STORAGE_KEY) == null}
        size="small">
        Reset state snapshot
      </ReactUI.QuietButton>
    </div>
  );
}

const root = document.getElementById('rex-query-root');

let app = ReactDOM.render(
  <QueryBuilderApp
    api="/query/query/"
    onState={onState}
    toolbar={<Toolbar />}
    initialState={_currentState}
  />,
  root,
);
