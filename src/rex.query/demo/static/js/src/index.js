import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import * as qs from 'qs';

import QueryBuilderApp from './QueryBuilderApp';


let params = qs.parse(window.location.search.substr(1));


function readQueryFromLocation() {
  let data;
  try {
    data = JSON.parse(window.location.hash.trim().slice(1));
  } catch (_err) {
    data = null;
  }
  return data;
}


function storeQueryToLocation(query) {
  window.location.hash = JSON.stringify(query);
}


function onQuery(query) {
  if (params.rememberQuery) {
    storeQueryToLocation(query);
  }
}


let query = params.rememberQuery ? readQueryFromLocation() : null;

ReactDOM.render(
  <QueryBuilderApp
    api={params.api}
    initialQuery={query}
    onQuery={onQuery}
    />,
  document.getElementById('root')
);

