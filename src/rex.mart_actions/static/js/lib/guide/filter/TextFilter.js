/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import {Input} from 'rex-widget/form';
import * as stylesheet from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';

import Filter from './Filter';
import * as F from './FilterUtils';

let style = stylesheet.create({
  Input: {
    Component: Input,
    Root: {
      fontSize: '90%',
      height: 30,
      padding: css.padding(2, 8),
    }
  }
});

export default class TextFilter extends React.Component {

  render() {
    let {title, ...props} = this.props;
    return (
      <Filter title={title}>
        <style.Input
          placeholder="Filter..."
          debounce={500}
          value={this.value}
          onChange={this.onChange}
          />
      </Filter>
    );
  }

  get value() {
    let {expression, query} = this.props;
    let value = F.getValue(query, expression);
    return F.unquote(value);
  }

  @autobind
  onChange(value) {
    let {expression, query, onQueryUpdate} = this.props;
    if (value) {
      query = F.remove(query, expression);
      query = F.apply(query, expression, '~', F.quote(value));
    } else {
      query = F.remove(query, expression);
    }
    onQueryUpdate(query);
  }
}
