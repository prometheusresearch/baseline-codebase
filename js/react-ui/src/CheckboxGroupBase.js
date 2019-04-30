/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import React from 'react';
import PropTypes from 'prop-types';

import {noop} from './Utils';
import * as I18N from './I18N';
import * as Focus from './Focus';
import CheckboxBase from './CheckboxBase';

type Value = Array<string>;

type Option = {
  label: string,
  hint?: string,
  value: string,
};

export let primitiveValueStrategy = {
  findIndex(value: ?Value, option: Option): number {
    if (!value) {
      return -1;
    }
    return value.indexOf(option.value);
  },

  optionToValue(option: Option): string {
    return option.value;
  },

  isChecked(value: ?Array<string>, option: Option): boolean {
    return this.findIndex(value, option) > -1;
  },

  update(value: ?Value, option: Option, checked: boolean): Value {
    value = value || [];
    value = value.slice(0);
    let idx = this.findIndex(value, option);
    if (checked) {
      invariant(idx === -1, 'Duplicate id added');
      value.push(this.optionToValue(option));
    } else {
      invariant(idx > -1, 'Non-existent id unchecked');
      value.splice(idx, 1);
    }
    return value;
  },
};

export let stylesheet = {
  Root: 'div',
  CheckboxWrapper: 'div',
  Checkbox: CheckboxBase,
};

type Props = {
  options: Array<Option>,
  disabled?: boolean,
  tabIndex?: number,
  valueStrategy: typeof primitiveValueStrategy,
  onChange: (Value) => *,
  value: Value,

  layout: 'horizontal' | 'vertical',

  onFocus?: (UIEvent) => *,
  onBlur?: (UIEvent) => *,

  variant?: Object,
};

export default class CheckboxGroupBase extends React.Component<*, Props, *> {
  static propTypes = {
    valueStrategy: PropTypes.object,
  };

  static stylesheet = stylesheet;

  static contextTypes = I18N.contextTypes;

  static defaultProps = {
    valueStrategy: primitiveValueStrategy,
    onChange: noop,
    layout: 'vertical',
    tabIndex: 0,
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

  renderOption(option: Option, idx: number) {
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

  onChange(option: Option, checked: boolean) {
    let {value, valueStrategy} = this.props;
    value = valueStrategy.update(value, option, checked);
    this.props.onChange(value);
  }
}
