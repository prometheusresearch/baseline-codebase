/**
 * @flow
 */

import type {Domain} from './model';

import React from 'react';

import QueryBuilder from './QueryBuilder';
import {Message} from './ui';
import {fetchCatalog} from './fetch';

// eslint-disable-next-line
const API = (typeof __rex_root__ !== 'undefined' ? __rex_root__ : '') + '/query/';

export default class QueryBuilderApp extends React.Component {
  state: {domain: ?Domain} = {
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
    let {api, initialQuery, limitSelectQuery} = this.props;
    if (domain == null) {
      return (
        <Message height="100%">
          Initializing database catalog...
        </Message>
      );
    } else {
      return (
        <QueryBuilder
          api={api}
          domain={domain}
          initialQuery={initialQuery}
          limitSelectQuery={limitSelectQuery}
          onQuery={this.props.onQuery}
          onState={this.props.onState}
          onSearch={this.props.onSearch}
          toolbar={this.props.toolbar}
        />
      );
    }
  }

  componentDidMount() {
    fetchCatalog(this.props.api).then(domain => {
      this.setState({domain});
    });
  }
}
