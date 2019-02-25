/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';

import {uniqueId, noop} from './Utils';
import * as I18N from './I18N';
import * as Focus from './Focus';

type Props = {
  value?: boolean,
  label?: string,
  title?: string,
  hint?: string,
  variant?: Object,
  disabled?: boolean,
  focusIndex?: number,
  onChange: (boolean) => number,
};

type Component = string | ReactClass<*>;

export type Stylesheet = {
  Root: Component,
  Input: Component,
  LabelWrapper: Component,
  Hint: Component,
  Label: Component,
};

export let stylesheet: Stylesheet = {
  Root: 'div',
  Input: 'input',
  LabelWrapper: 'div',
  Hint: 'div',
  Label: 'div',
};

export default class CheckboxBase extends React.Component<*, Props, *> {
  ariaId: string;

  static contextTypes = I18N.contextTypes;

  static stylesheet = stylesheet;

  static defaultProps = {
    onChange: noop,
  };

  constructor(props: Props) {
    super(props);
    this.ariaId = uniqueId('aria');
  }

  render() {
    let {
      value,
      label,
      title,
      hint,
      variant,
      disabled,
      focusIndex,
      ...props
    } = this.props;
    let {
      Root,
      Input,
      Label,
      Hint,
      LabelWrapper,
    } = this.constructor.stylesheet;
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

  onClick = () => {
    if (!this.props.disabled) {
      let value = !this.props.value;
      this.props.onChange(value);
    }
  };

  onChange = (e: UIEvent) => {
    let checked: boolean = (e.target: any).checked;
    this.props.onChange(checked);
  };
}
