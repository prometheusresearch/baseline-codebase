import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactUI from '@prometheusresearch/react-ui';
import * as qs from 'qs';

import QueryBuilderApp from './QueryBuilderApp';
import * as q from './model/Query';
import debounce from 'debounce-promise';

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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function doSearch({searchTerm, navigation}) {
  console.log('Search for:', searchTerm);
  return delay(1000).then(_ => {
    if (searchTerm == null) {
      let searchResultList = Array.from(navigation.values());
      return searchResultList;
    } else {
      let searchTermRe = new RegExp(searchTerm, 'ig');
      let searchResultList = [];
      for (let item of navigation.values()) {
        if (searchTermRe.test(item.label) || searchTermRe.test(item.value)) {
          searchResultList.push({label: item.label, value: item.value});
        }
      }
      return searchResultList;
    }
  });
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
    onSearch={debounce(doSearch, 700)}
    toolbar={<Toolbar />}
    />,
  document.getElementById('root')
);

