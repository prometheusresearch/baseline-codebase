/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import {style} from '@prometheusresearch/react-ui/stylesheet';

import LocalizedString from './LocalizedString';
import MarkupString from './MarkupString';


let HeaderStyle = style('h2', {
  fontSize: '24pt',
  disabled: {
    color: '#aaa'
  }
});

function Text(props) {
  return (
    <MarkupString
      {...props}
      Component={HeaderStyle}
      inline
      variant={{disabled: props.disabled}}
      />
  );
}

export default class Header extends React.Component {
  render() {
    let {text, disabled} = this.props;
    return (
      <LocalizedString
        Component={Text}
        text={text}
        disabled={disabled}
        />
    );
  }
}

