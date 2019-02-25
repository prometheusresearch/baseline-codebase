/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import uniqueId from 'lodash/uniqueId';

import {style, css} from './stylesheet';
import Block from './Block';
import Text from './Text';
import LabelText from './LabelText';
import ErrorText from './ErrorText';
import {fontSize} from './theme';

let Hint = style(Text, {
  color: '#222',
  fontSize: fontSize['x-small'],
  textAlign: css.textAlign.left,
  padding: css.padding(0, 0),
  disabled: {
    color: '#aaa',
    cursor: 'not-allowed',
  }
});

export default class Field extends React.Component {

  constructor(props) {
    super(props);
    this.id = uniqueId('formfield');
  }

  render() {
    let {
      input,
      label, hint,
      error, errorInline,
      disabled, required, invalid
    } = this.props;

    if (error && !invalid) {
      invalid = true;
    }
    if (typeof errorInline === 'string') {
      errorInline = <ErrorText>{errorInline}</ErrorText>;
    }
    if (typeof error === 'string') {
      error = <ErrorText>{error}</ErrorText>;
    }
    return (
      <Block variant={{disabled, invalid}}>
        {label &&
          <Block marginBottom="xx-small">
            <label htmlFor={this.id}>
              <Block>
                <LabelText variant={{invalid, disabled}}>
                  {label}
                </LabelText>
                {required &&
                  <Block inline marginStart="xx-small">
                    <ErrorText>*</ErrorText>
                  </Block>}
                {errorInline &&
                  <Block inline marginStart="xx-small">
                    {errorInline}
                  </Block>}
              </Block>
              {hint &&
                <Block>
                  <Hint variant={{invalid, disabled}}>
                    {hint}
                  </Hint>
                </Block>}
            </label>
          </Block>}
        <Block>
          {React.cloneElement(input, {id: this.id})}
        </Block>
        {error}
      </Block>
    );
  }

}
