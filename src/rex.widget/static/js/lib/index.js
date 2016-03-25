/**
 * @copyright 2016, Prometheus Research, LLC
 */

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
