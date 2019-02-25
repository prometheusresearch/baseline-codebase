/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';

import {noop} from './Utils';
import * as I18N from './I18N';
import * as Focus from './Focus';
import Radio from './RadioBase';

type Option = {
  value: string,
  label?: string,
  hint?: string,
};

type Props = {
  options: Array<Option>,
  value: string,
  onChange: (string) => *,
  layout?: 'horizontal' | 'vertical',
  disabled?: boolean,
  variant?: Object,
  tabIndex?: number,

  onFocus: (ev: UIEvent) => *,
  onBlur: (ev: UIEvent) => *,
};

type Component = string | ReactClass<*>;

export type Stylesheet = {
  Root: Component,
  RadioWrapper: Component,
  Radio: Component,
};

export let stylesheet: Stylesheet = {
  Root: 'div',
  RadioWrapper: 'div',
  Radio: Radio,
};

export default class RadioGroupBase extends React.Component<*, Props, *> {
  static contextTypes = I18N.contextTypes;

  static stylesheet = stylesheet;

  static defaultProps = {
    onChange: noop,
    onBlur: noop,
    onFocus: noop,
    layout: 'vertical',
    tabIndex: 0,
  };

  render() {
    let {options, disabled, tabIndex} = this.props;
    let {Root} = this.constructor.stylesheet;
    options = options.map(this.renderOption, this);
    return (
      <Focus.FocusableList tabIndex={disabled ? undefined : tabIndex}>
        <Root role="radiogroup">
          {options}
        </Root>
      </Focus.FocusableList>
    );
  }

  renderOption(option: Option, idx: number) {
    let {RadioWrapper, Radio} = this.constructor.stylesheet;
    let {value, layout, disabled, variant} = this.props;
    let {i18n = I18N.defaultContext} = this.context;
    let checked = value === option.value;
    variant = {
      rtl: i18n.dir === 'rtl',
      ltr: i18n.dir === 'ltr',
      disabled,
      ...variant,
    };
    return (
      <RadioWrapper
        key={option.value}
        variant={{
          horizontal: layout === 'horizontal',
          vertical: layout === 'vertical',
          ...variant,
        }}>
        <Radio
          disabled={disabled}
          focusIndex={idx}
          tabIndex={-1}
          idx={idx}
          value={checked}
          label={option.label}
          hint={option.hint}
          onChange={this.onChange.bind(this, option.value)}
          onFocus={this.props.onFocus}
          onBlur={this.props.onBlur}
        />
      </RadioWrapper>
    );
  }

  onChange(id: string, checked: boolean) {
    if (checked) {
      this.props.onChange(id);
    }
  }
}
