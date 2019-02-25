/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {noop} from 'lodash';

import Radio from './RadioBase';
import * as I18N from './I18N';
import * as Focus from './Focus';

export default class RadioGroupBase extends React.Component {

  static contextTypes = I18N.contextTypes;

  static stylesheet = {
    Root: 'div',
    RadioWrapper: 'div',
    Radio: Radio,
  };

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

  renderOption(option, idx) {
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

  onChange(id, checked) {
    if (checked) {
      this.props.onChange(id);
    }
  }
}
