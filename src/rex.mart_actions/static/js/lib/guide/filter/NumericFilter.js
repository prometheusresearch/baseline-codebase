/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import {HBox} from 'rex-widget/layout';
import {Input} from 'rex-widget/form';
import tryParseFloat from 'rex-widget/lib/tryParseFloat';
import * as stylesheet from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';
import {Notification, showNotification} from 'rex-widget/ui';

import Filter from './Filter';
import * as F from './FilterUtils';


let style = stylesheet.create({
  Input: {
    Component: Input,
    Root: {
      fontSize: '90%',
      height: 30,
      padding: css.padding(2, 8)
    }
  }
});


export default class NumericFilter extends React.Component {
  render() {
    let {title} = this.props;

    return (
      <Filter title={title}>
        <HBox>
          <style.Input
            placeholder="Min"
            debounce={500}
            value={this.value.min}
            onChange={this.onChangeMin}
            />
          <style.Input
            placeholder="Max"
            debounce={500}
            value={this.value.max}
            onChange={this.onChangeMax}
            />
          </HBox>
      </Filter>
    );
  }

  get value() {
    let {expression, query} = this.props;

    let range = {};
    F.getValueList(query, expression).forEach((value) => {
      if (value.startsWith('>=')) {
        range.min = value.substring(2);
      } else if (value.startsWith('<=')) {
        range.max = value.substring(2);
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
    if ((value !== null) && (typeof tryParseFloat(value) !== 'number')) {
      showNotification(
        <Notification
          kind={'danger'}
          text={`${value} is not a valid number`}
          />
      );
      return;
    }

    let {expression, query, onQueryUpdate} = this.props;
    if (value !== null) {
      query = F.remove(query, expression, op);
      query = F.apply(query, expression, op, value);
    } else {
      query = F.remove(query, expression, op);
    }
    onQueryUpdate(query);
  }
}

