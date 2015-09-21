/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var BaseLink        = require('../Link');
var populateParams  = require('./populateParams');

/**
 * Renders a <BaseLink> from ../Link - even though it does not exist.
 * please explain
 */
var Link = React.createClass({

  propTypes: {
    /**
     * object
     *
     * please explain
     */
    params: React.PropTypes.object,
    
    /**
     * string
     *
     * The link text.
     */
    text: React.PropTypes.string,
    
    /**
     * object
     *
     * please explain
     */
    context: React.PropTypes.object
  },

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
