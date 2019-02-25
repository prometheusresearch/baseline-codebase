/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import {uniqueId, noop} from './Utils';
import * as I18N from './I18N';
import * as Focus from './Focus';

type Props = {
  value: boolean,
  onChange: (boolean) => *,
  label?: string,
  title?: string,
  hint?: string,
  idx: number,
  disabled?: boolean,
  focusIndex?: number,
  inputRef: (HTMLElement) => *,
  variant?: Object,
};

type Component = string | ReactClass<*>;

export type Stylesheet = {
  Root: Component,
  Input: Component,
  LabelWrapper: Component,
  Label: Component,
  Hint: Component,
};

function Root({variant: _variant, ...props}) {
  return <div {...props} />;
}

function Input({inputRef: _inputRef, ...props}) {
  return <input {...props} />;
}

export let stylesheet: Stylesheet = {
  Root,
  Input,
  LabelWrapper: 'div',
  Hint: 'div',
  Label: 'div',
};

export default class RadioBase extends React.Component<*, Props, *> {
  ariaId: string;

  static stylesheet = stylesheet;

  static contextTypes = I18N.contextTypes;

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
      inputRef,
      variant,
      disabled,
      focusIndex,
      idx: _idx,
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
            ref={inputRef}
            inputRef={inputRef}
            type="radio"
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
      this.props.onChange(true);
    }
  };

  onChange = (e: UIEvent) => {
    // $FlowIssue: ...
    let checked = e.target.checked;
    this.props.onChange(checked);
  };
}
