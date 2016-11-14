/**
 * @flow
 */

import type {Domain} from './model'

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

// XXX: Just some place to make a predefined query, this is useful for debug but
// make sure we remove it before the release!
//
//  let q = require('./model/Query');
//  let qq = q.pipeline(
//    q.here,
//    q.def(
//      'study count',
//      q.pipeline(
//        q.navigate('study'),
//        q.aggregate('count'),
//      )
//    ),
//    q.select({
//      'study count': q.pipeline(q.navigate('study count')),
//    }),
//  );

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
