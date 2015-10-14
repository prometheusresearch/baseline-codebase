/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

import React              from 'react';
import classNames         from 'classnames';
import {isTouchDevice}    from './Environment';

import {forceRefreshData as forceRefreshDataLegacy} from './DataSpecificationMixin';
import {forceRefresh} from './data/DataComponent';

if (isTouchDevice) {
  React.initializeTouchEvents(true);
}

import './TransitionableHandlers';

function forceRefreshData() {
  forceRefreshDataLegacy();
  forceRefresh();
}

module.exports = window.RexWidget = {
  forceRefreshData: forceRefreshData,
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
  DataTable: require('./DataTable'),
  DataTableWithSearch: require('./DataTableWithSearch'),
  emptyFunction: require('./emptyFunction'),
  Forms: require('./forms'),
  Hoverable: require('./Hoverable'),
  Icon: require('./Icon'),
  IconButton: require('./IconButton'),
  IFrame: require('./IFrame'),
  Info: require('./Info'),
  Layout: require('./Layout'),
  Link: require('./Link'),
  LinkButton: require('./library/LinkButton'),
  Modal: require('./Modal'),
  ModalButton: require('./ModalButton'),
  NotificationCenter: require('./NotificationCenter'),
  Port: require('./Port'),
  Preloader: require('./Preloader'),
  Query: require('./Query'),
  QueryString: require('./qs'),
  render: require('./render'),
  SearchInput: require('./SearchInput'),
  Select: require('./Select'),
  ShowPreloader: require('./ShowPreloader'),
  StyleUtils: require('./StyleUtils'),
  Tab: require('./Tab'),
  Tabs: require('./Tabs'),
  Transitionable: require('./Transitionable'),
};
