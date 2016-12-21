import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as qs from 'qs';

import QueryBuilderApp from './QueryBuilderApp';
import * as q from './model/Query';

let params = qs.parse(window.location.search.substr(1));

function readQueryFromLocation() {
  let data;
  try {
    data = q.deserializeQuery(window.location.hash.trim().slice(1));
  } catch (_err) {
    data = null;
  }
  return data;
}

function onQuery(query) {
  if (params.rememberQuery) {
    window.location.hash = q.serializeQuery(query);
  }
}

function Toolbar() {
  return (
    <div>
      <ReactUI.QuietButton size="small">Save</ReactUI.QuietButton>
      <ReactUI.QuietButton size="small">Rename</ReactUI.QuietButton>
    </div>
  );
}

let query = params.rememberQuery ? readQueryFromLocation() : null;

ReactDOM.render(
  <QueryBuilderApp
    api={params.api}
    initialQuery={query}
    onQuery={onQuery}
    toolbar={<Toolbar />}
    />,
  document.getElementById('root')
);

