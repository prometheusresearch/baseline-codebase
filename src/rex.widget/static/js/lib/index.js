/**
 * @copyright 2016, Prometheus Research, LLC
 */

__webpack_public_path__ = window.__PUBLIC_PATH__;

import './index.css';

import React              from 'react';
import {isTouchDevice}    from './Environment';

if (isTouchDevice) {
  React.initializeTouchEvents(true);
}

import './TransitionableHandlers';

module.exports = window.RexWidget = {
  Authorized: require('./Authorized'),
  Autocomplete: require('./Autocomplete'),
  Link: require('./Link'),
  QueryString: require('./qs'),
  render: require('./render'),
  Select: require('./Select'),
  Transitionable: require('./Transitionable'),
};
