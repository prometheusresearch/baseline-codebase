/**
 * @flow
 */

import type {Domain} from './model/Query'

import React from 'react';

import QueryBuilder from './QueryBuilder';
import {Message} from './ui';
import {fetchCatalog} from './fetch';


export default class QueryBuilderApp extends React.Component {
  state: {domain: ?Domain} = {
    domain: null,
  };

  static defaultProps = {
    api: '/query/',
    initialQuery: null,
    onQuery: null,
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
      return (
        <QueryBuilder
          api={api}
          domain={domain}
          initialQuery={this.props.initialQuery}
          onQuery={this.props.onQuery}
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
