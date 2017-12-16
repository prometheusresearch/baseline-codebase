/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import debounce from 'debounce-promise';

import {Action} from 'rex-action';
import {autobind} from 'rex-widget/lang';
import QueryBuilderApp from 'rex-query/QueryBuilderApp';

import martFromContext from './martFromContext';


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
  if (resultList === null) {
    return [];
  }
  // We need to return original items so the titles aren't messed up.
  let found = new Set();
  resultList.forEach(item => {
    found.add(item.value);
  });
  return items.filter(item => found.has(item.value));
}


export default class QueryBuilder extends React.Component {
  static defaultProps = {
    icon: 'eye-open'
  };

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
        let mart = martFromContext(this.props.context);
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
    750,
  );

  render() {
    let {runQuery, exportFormats} = this.props;
    let mart = martFromContext(this.props.context);
    let api = `${runQuery.path}?mart=${mart}`;

    return (
      <QueryBuilderApp
        exportFormats={exportFormats}
        api={api}
        onSearch={this.onSearch}
        />
    );
  }
}

