/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

if (Object.assign === undefined) {
  Object.assign = require('object-assign');
}

module.exports = {
  DataSet: require('./DataSet'),
  DataSpecification: require('./DataSpecification'),
  DataSpecificationMixin: require('./DataSpecificationMixin'),
  forceRefreshData: require('./DataSpecificationMixin').forceRefreshData,
  DataTable: require('./DataTable'),
  DataTableWithSearch: require('./DataTableWithSearch'),
  createWidgetClass: require('./createWidgetClass'),
  Layout: require('./Layout'),
  Hoverable: require('./Hoverable'),
  Autocomplete: require('./Autocomplete'),
  Preloader: require('./Preloader'),
  ShowPreloader: require('./ShowPreloader'),
  Select: require('./Select'),
  Modal: require('./Modal'),
  ModalButton: require('./ModalButton'),
  IFrame: require('./IFrame'),
  Button: require('./Button'),
  Icon: require('./Icon'),
  IconButton: require('./IconButton'),
  SearchInput: require('./SearchInput'),
  Port: require('./Port'),
  Query: require('./Query'),
  Forms: require('./forms'),
  Link: require('./Link'),
  Authorized: require('./Authorized'),
  Info: require('./Info'),
  Tab: require('./Tab'),
  Tabs: require('./Tabs'),
  NotificationCenter: require('./NotificationCenter'),
  StyleUtils: require('./StyleUtils'),
  Cell: require('./Cell'),
  cell: require('./Cell').cell,
  cloneElement: require('./cloneElement'),
  emptyFunction: require('./emptyFunction'),
  constructDataSpec: require('../Application').constructDataSpec
};

window.RexWidget = module.exports;
