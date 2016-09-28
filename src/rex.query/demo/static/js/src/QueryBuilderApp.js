/**
 * @flow
 */

import type {Domain} from './model/Query'

import React from 'react';
import QueryBuilder from './QueryBuilder';
import {Message} from './ui';
import {fetchCatalog} from './fetch';
import * as q from './model/Query';

export default class QueryBuilderApp extends React.Component {

  state: {domain: ?Domain} = {
    domain: null,
  };

  static defaultProps = {
    api: '/query/',
  };

  render() {
    let {domain} = this.state;
    let {api} = this.props;
    if (domain == null) {
      return (
        <Message height="100%">
          Initializing database catalog...
        </Message>
      );
    } else {
      let query = q.pipeline(
        q.navigate('study'),
      );
      return (
        <QueryBuilder
          api={api}
          domain={domain}
          initialQuery={query}
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
