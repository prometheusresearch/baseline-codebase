/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import React from 'react';
import {style} from 'react-stylesheet';

// $FlowFixMe: cannot resolve
import loadingIndicatorImg  from '!!file!./loading-indicator.gif?publicPath=false'; // eslint-disable-line

let src = (typeof __rex_bundle_root__ !== 'undefined'
           ? __rex_bundle_root__ // eslint-disable-line
           : '') + loadingIndicatorImg;

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
