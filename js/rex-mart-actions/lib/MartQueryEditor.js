/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import debounce from 'debounce-promise';

import {QueryBuilderApp} from 'rex-query/api';
import MartQueryToolbar from './MartQueryToolbar';

export default class MartQueryEditor extends React.Component {
  onSearch = debounce(
    ({searchTerm, navigation}) =>
      Promise.resolve().then(() => {
        let items = Array.from(navigation.values());

        if (searchTerm == null || items.length === 0) {
          return items;
        }

        let type = items[0].context.prev.type;

        // We implement only search for void and table context for now.
        if (!(type.name === 'void' || (type.name === 'record' && type.entity != null))) {
          return localSearch(searchTerm, navigation);
        }

        let table = type.name === 'record' ? type.entity : null;
        let relationList = items.map(item => ({label: item.label, value: item.value}));
        let {mart} = this.props;
        let data = JSON.stringify({
          search_term: searchTerm,
          table,
          relation_list: relationList,
        });
        return this.props.filterRelationList
          .params({mart})
          .data(data)
          .produce()
          .then(result => sanitizeSearchResultList(items, result.resultList));
      }),
    700,
  );

  render() {
    let {
      initialQuery,
      initialChartList,
      onQuery,
      onState,
      runQuery,
      queryLimit,
      mart,
      saving,
      saveDisabled,
      onSave,
      title,
      onChangeTitle,
      exportFormats,
      chartConfigs,
    } = this.props;
    return (
      <QueryBuilderApp
        api={`${runQuery.path}?mart=${mart}`}
        onSearch={this.onSearch}
        limitSelectQuery={queryLimit}
        initialQuery={initialQuery}
        initialChartList={initialChartList}
        onQuery={onQuery}
        onState={onState}
        exportFormats={exportFormats}
        chartConfigs={chartConfigs}
        toolbar={
          <MartQueryToolbar
            saving={saving}
            title={title}
            saveDisabled={saveDisabled}
            onChangeTitle={onChangeTitle}
            onSave={onSave}
          />
        }
      />
    );
  }
}

function localSearch(searchTerm, navigation) {
  let searchTermRe = new RegExp(searchTerm, 'ig');
  let searchResultList = [];
  for (let item of navigation.values()) {
    if (searchTermRe.test(item.label) || searchTermRe.test(item.value)) {
      searchResultList.push({label: item.label, value: item.value});
    }
  }
  return searchResultList;
}

function sanitizeSearchResultList(items, resultList) {
  // We need to return original items so the titles aren't messed up.
  let found = new Set();
  resultList.forEach(item => {
    found.add(item.value);
  });
  return items.filter(item => found.has(item.value));
}
