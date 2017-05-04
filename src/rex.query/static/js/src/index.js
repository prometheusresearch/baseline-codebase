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
    const rawData = JSON.parse(window.location.hash.trim().slice(1));
    data = {
      query: q.deserializeQuery(rawData.query),
      chartList: rawData.chartList,
      activeTab: rawData.activeTab,
    };
  } catch (_err) {
    data = {query: undefined, chartList: undefined, activeTab: undefined};
  }
  return data;
}

function onState({query, chartList, activeTab}) {
  if (params.rememberQuery) {
    window.location.hash = JSON.stringify({
      query: q.serializeQuery(query),
      chartList,
      activeTab,
    });
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

let {query, chartList, activeTab} = params.rememberQuery
  ? readQueryFromLocation()
  : {query: undefined, chartList: undefined, activeTab: undefined};

function render(element, props = {}) {
  ReactDOM.render(
    <QueryBuilderApp
      api={params.api}
      initialQuery={query}
      initialChartList={chartList}
      initialActiveTab={activeTab}
      onState={onState}
      onSearch={debounce(doSearch, 700)}
      toolbar={<Toolbar />}
      {...props}
    />,
    element,
  );
}

// Render if root is available

const root = document.getElementById('rex-query-root');

if (root != null) {
  render(root);
}
