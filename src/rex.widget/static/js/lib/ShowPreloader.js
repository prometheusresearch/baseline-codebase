/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React     = require('react');
var Preloader = require('./Preloader');
var DataSet   = require('./DataSet');
var {VBox}    = require('./Layout');

var ShowPreloader = React.createClass({

  render() {
    var {children, showPreloaderWhenNoData, ...props} = this.props;
    var datasets = Object
      .keys(props)
      .map(key => props[key])
      .filter(prop => (prop instanceof DataSet));
    var showPreloader = (
      datasets.some(d => d.loading) ||
      showPreloaderWhenNoData && datasets.some(d => d.data === null)
    );
    if (showPreloader) {
      return <Preloader />
    } else {
      if (React.Children.count(children) > 1) {
        return <VBox>{children}</VBox>;
      } else {
        return children;
      }
    }
  },

  getDefaultProps() {
    return {showPreloaderWhenNoData: false};
  }
});

module.exports = ShowPreloader;
