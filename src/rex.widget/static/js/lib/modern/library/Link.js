/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var BaseLink        = require('../Link');
var populateParams  = require('./populateParams');

var Link = React.createClass({

  render() {
    var {params, text, context, ...props} = this.props;
    params = populateParams(params || {}, context);
    if (params === null) {
      return null;
    }
    return <BaseLink {...props} params={params}>{text}</BaseLink>
  }
});


module.exports = Link;
