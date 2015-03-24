/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

module.exports = {
  DataSpecification: require('./DataSpecification'),
  DataSpecificationMixin: require('./DataSpecificationMixin'),
  DataTable: require('./DataTable'),
  createWidgetClass: require('./createWidgetClass'),
  Layout: require('./Layout'),
  Preloader: require('./Preloader'),
  ShowPreloader: require('./ShowPreloader'),
  Select: require('./Select'),
  Modal: require('./Modal'),
  Button: require('./Button'),
  SearchInput: require('./SearchInput'),
  Port: require('./Port'),
  Query: require('./Query'),
  Forms: require('./forms'),
  Link: require('./Link'),
  Authorized: require('./Authorized'),
  NotificationCenter: require('./NotificationCenter'),
  StyleUtils: require('./StyleUtils'),
  Cell: require('./Cell'),
  cell: require('./Cell').cell
};

window.RexWidget = module.exports;
