/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import invariant from 'invariant';
import PropTypes from 'prop-types';
import React from 'react';
import {noop} from 'lodash';

import * as I18N from './I18N';
import * as Focus from './Focus';
import Checkbox from './CheckboxBase';

export let primitiveValueStrategy = {

  findIndex(value, option) {
    if (!value) {
      return -1;
    }
    return value.indexOf(option.value);
  },

  optionToValue(option) {
    return option.value;
  },

  isChecked(value, option) {
    return this.findIndex(value, option) > -1;
  },

  update(value, option, checked) {
    value = value || [];
    value = value.slice(0);
    let idx = this.findIndex(value, option);
    if (checked) {
      invariant(
        idx === -1,
        'Duplicate id added'
      );
      value.push(this.optionToValue(option));
    } else {
      invariant(
        idx > -1,
        'Non-existent id unchecked'
      );
      value.splice(idx, 1);
    }
    return value;
  }

};

export default class CheckboxGroupBase extends React.Component {

  static propTypes = {
    valueStrategy: PropTypes.object
  };

  static contextTypes = I18N.contextTypes;

  static defaultProps = {
    valueStrategy: primitiveValueStrategy,
    onChange: noop,
    layout: 'vertical',
    tabIndex: 0,
  };

  static stylesheet = {
    Root: 'div',
    CheckboxWrapper: 'div',
    Checkbox: Checkbox,
  };

  render() {
    let {options, disabled, tabIndex} = this.props;
    let {Root} = this.constructor.stylesheet;
    options = options.map(this.renderOption, this);
    return (
      <Focus.FocusableList tabIndex={disabled ? undefined : tabIndex}>
        <Root>
          {options}
        </Root>
      </Focus.FocusableList>
    );
  }

  renderOption(option, idx) {
    let {valueStrategy, layout, disabled, variant} = this.props;
    let {CheckboxWrapper, Checkbox} = this.constructor.stylesheet;
    let {i18n = I18N.defaultContext} = this.context;
    let checked = valueStrategy.isChecked(this.props.value, option);
    variant = {
      rtl: i18n.dir === 'rtl',
      ltr: i18n.dir === 'ltr',
      disabled,
      ...variant,
    };
    return (
      <CheckboxWrapper
        key={valueStrategy.optionToValue(option)}
        variant={{
          horizontal: layout === 'horizontal',
          vertical: layout === 'vertical',
          ...variant,
        }}>
        <Checkbox
          focusIndex={idx}
          tabIndex={-1}
          disabled={disabled}
          label={option.label}
          hint={option.hint}
          value={checked}
          onBlur={this.props.onBlur}
          onFocus={this.props.onFocus}
          onChange={this.onChange.bind(this, option)}
          />
      </CheckboxWrapper>
    );
  }

  onChange(option, checked) {
    let {value, valueStrategy} = this.props;
    value = valueStrategy.update(value, option, checked);
    this.props.onChange(value);
  }
}
