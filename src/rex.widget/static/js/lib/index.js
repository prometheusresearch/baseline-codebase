/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import './index.css';

import React              from 'react';
import classNames         from 'classnames';
import {isTouchDevice}    from './Environment';

if (isTouchDevice) {
  React.initializeTouchEvents(true);
}

import './TransitionableHandlers';

module.exports = window.RexWidget = {
  forceRefreshData: require('./forceRefreshData'),
  Authorized: require('./Authorized'),
  Autocomplete: require('./Autocomplete'),
  Button: require('./Button'),
  Cell: require('./Cell'),
  cell: require('./Cell').cell,
  classNames: classNames,
  cloneElement: require('./cloneElement'),
  createWidgetClass: require('./createWidgetClass'),
  DataSet: require('./DataSet'),
  DataSpecification: require('./DataSpecification'),
  DataSpecificationMixin: require('./DataSpecificationMixin'),
  emptyFunction: require('./emptyFunction'),
  IconButton: require('./IconButton'),
  Icon: require('./ui/Icon'),
  IFrame: require('./IFrame'),
  Layout: require('./Layout'),
  Link: require('./Link'),
  LinkButton: require('./library/LinkButton'),
  Modal: require('./Modal'),
  ModalButton: require('./ModalButton'),
  NotificationCenter: require('./NotificationCenter'),
  Port: require('./Port'),
  Query: require('./Query'),
  QueryString: require('./qs'),
  render: require('./render'),
  Select: require('./Select'),
  StyleUtils: require('./StyleUtils'),
  Transitionable: require('./Transitionable'),
};
