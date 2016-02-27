/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import {VBox, HBox} from 'rex-widget/layout';

import {CheckboxButton} from '../../ui';
import * as F from './FilterUtils';
import Filter from './Filter';

export default class BooleanFilter extends React.Component {

  render() {
    let {title} = this.props;
    return (
      <Filter>
        <CheckboxButton label={title} value={this.value} onChange={this.onChange} />
      </Filter>
    );
  }

  get value() {
    let {expression, query} = this.props;
    let value = F.getValue(query, expression);
    return value === '';
  }

  @autobind
  onChange() {
    let {expression, query, onQueryUpdate} = this.props;
    if (this.value) {
      onQueryUpdate(F.remove(query, expression));
    } else {
      onQueryUpdate(F.apply(query, expression));
    }
  }
}
