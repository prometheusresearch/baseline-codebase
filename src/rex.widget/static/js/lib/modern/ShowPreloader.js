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
    var {children, ...props} = this.props;
    var showPreloader = Object
      .keys(props)
      .map(key => props[key])
      .filter(prop => (prop instanceof DataSet))
      .some(dataset => dataset.loading);
    if (showPreloader) {
      return <Preloader />
    } else {
      if (React.Children.count(children) > 1) {
        return <VBox>{children}</VBox>;
      } else {
        return children;
      }
    }
  }
});

module.exports = ShowPreloader;
