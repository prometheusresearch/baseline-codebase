/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react');
var Button          = require('../Button');
var populateParams  = require('./populateParams');

var LinkButton = React.createClass({

  render() {
    var {href, params, context, text, ...props} = this.props;
    params = populateParams(params || {}, context);
    return (
      <Button
        {...this.props}
        href={href}
        params={params}>
        {text}
      </Button>
    );
  },

  getDefaultProps() {
    return {
      quiet: true,
      align: 'left'
    };
  }
});

module.exports = LinkButton;
