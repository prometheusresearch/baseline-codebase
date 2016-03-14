/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import DatetimeInput from 'rex-widget/lib/form/DatetimeInput';
import * as stylesheet from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';
import {Notification, showNotification} from 'rex-widget/ui';

import Filter from './Filter';
import * as F from './FilterUtils';


let style = stylesheet.create({
  Input: {
    Component: DatetimeInput,
    Root: {
      fontSize: '90%',
      padding: css.padding(2, 8)
    }
  }
});


export default class DateFilter extends React.Component {
  render() {
    let {title} = this.props;

    return (
      <Filter title={title}>
        <style.Input
          mode="date"
          format="YYYY-MM-DD"
          inputFormat="YYYY-MM-DD"
          inputProps={{placeholder: 'Min'}}
          debounce={500}
          dateTime={this.value.min}
          onChange={this.onChangeMin}
          />
        <style.Input
          mode="date"
          format="YYYY-MM-DD"
          inputFormat="YYYY-MM-DD"
          inputProps={{placeholder: 'Max'}}
          debounce={500}
          dateTime={this.value.max}
          onChange={this.onChangeMax}
          />
      </Filter>
    );
  }

  get value() {
    let {expression, query} = this.props;

    let range = {};
    F.getValueList(query, expression).forEach((value) => {
      if (value.startsWith('>=')) {
        range.min = F.unquote(value.substring(2));
      } else if (value.startsWith('<=')) {
        range.max = F.unquote(value.substring(2));
      }
    });

    return range;
  }

  @autobind
  onChangeMin(value) {
    this._doChange(value, '>=');
  }

  @autobind
  onChangeMax(value) {
    this._doChange(value, '<=');
  }

  _doChange(value, op) {
    if (value === 'Invalid date') {
      return;
    }

    let {expression, query, onQueryUpdate} = this.props;
    if (value) {
      query = F.remove(query, expression, op);
      query = F.apply(query, expression, op, F.quote(value));
    } else {
      query = F.remove(query, expression, op);
    }
    onQueryUpdate(query);
  }
}

