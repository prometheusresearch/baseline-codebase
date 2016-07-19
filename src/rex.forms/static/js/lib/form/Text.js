/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {style} from '@prometheusresearch/react-ui/stylesheet';

import LocalizedString from './LocalizedString';
import MarkupString from './MarkupString';


let TextStyle = style('span', {
  disabled: {
    color: '#aaa'
  }
});

function TextComponent(props) {
  return (
    <MarkupString
      {...props}
      Component={TextStyle}
      variant={{disabled: props.disabled}}
      />
  );
}


export default class Text extends React.Component {
  render() {
    let {text, disabled} = this.props;
    return (
      <ReactUI.Block paddingH="medium" marginBottom="medium">
        <LocalizedString
          Component={TextComponent}
          text={text}
          disabled={disabled}
          />
      </ReactUI.Block>
    );
  }
}


