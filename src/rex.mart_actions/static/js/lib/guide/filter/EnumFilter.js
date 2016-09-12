/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import {VBox, HBox} from 'rex-widget/layout';

import {CheckboxButton} from '../../ui';
import Filter from './Filter';
import * as F from './FilterUtils';

export default class EnumFilter extends React.Component {

  render() {
    let {title, labels, ...props} = this.props;
    let value = this.value;
    return (
      <Filter title={title}>
        {labels.sort().map(label =>
          <CheckboxButton
            key={label}
            name={label}
            value={value.indexOf(label) > -1}
            onChange={this.onChange}
            label={label}
            />)}
      </Filter>
    );
  }

  get value() {
    let {query, expression} = this.props;
    return parseSet(F.getValue(query, expression, '='));
  }

  @autobind
  onChange(checked, label) {
    let {query, expression, onQueryUpdate} = this.props;
    let value;
    if (checked) {
      value = this.value.concat(label);
    } else {
      value = this.value.slice(0);
      value.splice(value.indexOf(label), 1);
    }
    query = F.remove(query, expression, '=');
    if (value.length > 0) {
      query = F.apply(query, expression, '=', unparseSet(value));
    }
    onQueryUpdate(query);
  }
}

function parseSet(value) {
  if (!value) {
    return [];
  }
  value = value.replace(/^{/, '').replace(/}$/, '');
  value = value.split(',');
  value = value.map(F.unquote);
  return value;
}

function unparseSet(value) {
  if (!value) {
    return '{}';
  }
  return `{${value.map(F.quote).join(',')}}`;
}
