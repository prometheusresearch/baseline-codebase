/**
 * @flow
 */

import type {Domain} from './model/types';

import React from 'react';

import QueryBuilder from './QueryBuilder';
import {Message} from './ui';
import {fetchCatalog} from './fetch';

// eslint-disable-next-line
const API = (typeof __rex_root__ !== 'undefined' ? __rex_root__ : '') + '/query/';

type State = {domain: ?Domain};

export default class QueryBuilderApp extends React.Component<*, State> {
  queryBuilder: ?any;

  state = {
    domain: null,
  };

  static defaultProps = {
    api: API,
    initialQuery: null,
    onQuery: null,
    limitSelectQuery: 10000,
  };

  render() {
    let {domain} = this.state;
    let {
      api,
      initialQuery,
      initialChartList,
      initialActiveTab,
      initialState,
      limitSelectQuery,
    } = this.props;
    if (domain == null) {
      return <Message height="100%">Initializing database catalog...</Message>;
    } else {
      return (
        <QueryBuilder
          ref={this._onQueryBuidler}
          api={api}
          domain={domain}
          initialState={initialState}
          initialQuery={initialQuery}
          initialChartList={initialChartList}
          initialActiveTab={initialActiveTab}
          limitSelectQuery={limitSelectQuery}
          onQuery={this.props.onQuery}
          onState={this.props.onState}
          onSearch={this.props.onSearch}
          toolbar={this.props.toolbar}
          exportFormats={this.props.exportFormats}
          chartConfigs={this.props.chartConfigs}
        />
      );
    }
  }

  _onQueryBuidler = (queryBuilder: ?any) => {
    this.queryBuilder = queryBuilder;
  };

  componentDidMount() {
    fetchCatalog(this.props.api).then(domain => {
      this.setState({domain});
    });
  }
}
