/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {autobind} from 'rex-widget/lang';
import {QueryBuilderApp} from 'rex-query';


export default class QueryBuilder extends React.Component {
  static defaultProps = {
    icon: 'eye-open'
  };

  render() {
    let {runQuery} = this.props;
    let {mart} = this.props.context;
    let api = `${runQuery.path}?mart=${mart}`;
    return (
      <QueryBuilderApp api={api}/>
    );
  }
}

