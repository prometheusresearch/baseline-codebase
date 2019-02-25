/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import noop from 'lodash/noop';
import uniqueId from 'lodash/uniqueId';
import * as I18N from './I18N';
import * as Focus from './Focus';

export default class CheckboxBase extends React.Component {

  static contextTypes = I18N.contextTypes;

  static defaultProps = {
    onChange: noop,
    stylesheet: {
      Root: 'div',
      Input: 'input',
      LabelWrapper: 'div',
      Hint: 'div',
      Label: 'div',
    },
  };

  constructor(props) {
    super(props);
    this.ariaId = uniqueId('aria');
  }

  render() {
    let {
      value, label, title, hint, stylesheet,
      variant, disabled, focusIndex, ...props
    } = this.props;
    let {Root, Input, Label, Hint, LabelWrapper} = stylesheet;
    let {i18n = I18N.defaultContext} = this.context;
    variant = {
      rtl: i18n.dir === 'rtl',
      ltr: i18n.dir === 'ltr',
      disabled,
      ...variant,
    };
    return (
      <Root title={title} variant={variant}>
        <Focus.Focusable focusIndex={focusIndex}>
          <Input
            {...props}
            aria-labelledby={this.ariaId}
            disabled={disabled}
            variant={variant}
            type="checkbox"
            checked={value}
            onChange={this.onChange}
            />
        </Focus.Focusable>
        {label &&
          <LabelWrapper variant={variant} onClick={this.onClick}>
            <Label id={this.ariaId} variant={variant}>{label}</Label>
            <Hint variant={variant}>{hint}</Hint>
          </LabelWrapper>}
      </Root>
    );
  }

  onClick = _e => {
    if (!this.props.disabled) {
      let value = !this.props.value;
      this.props.onChange(value);
    }
  };

  onChange = e => {
    this.props.onChange(e.target.checked);
  };
}


