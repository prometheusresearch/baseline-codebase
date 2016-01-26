/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

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
  cloneElement: require('./cloneElement'),
  Link: require('./Link'),
  LinkButton: require('./library/LinkButton'),
  QueryString: require('./qs'),
  render: require('./render'),
  Select: require('./Select'),
  Transitionable: require('./Transitionable'),
};
