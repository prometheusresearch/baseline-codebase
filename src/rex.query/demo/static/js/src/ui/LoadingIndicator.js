/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import {style} from 'react-stylesheet';

// eslint-disable-next-line
import loadingIndicatorImg  from '!!file!./loading-indicator.gif?publicPath=false';

let src = window.__rex_public_path__ + loadingIndicatorImg;

export default class LoadingIndicator extends React.Component {

  render() {
    return (
      <Root>
        <img src={src} role="presentation" />
      </Root>
    );
  }

  shouldComponentUpdate() {
    return false;
  }
}

let Root = style('div', {
  base: {
    width: '100%',
    textAlign: 'center',
  }
});
