/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React   = require('react/addons');
var Button  = require('./Button');

var LinkButton = React.createClass({

  render() {
    return (
      <Button
        {...this.props}
        href={undefined}
        onClick={this.onClick}
        />
    );
  },

  onClick() {
    var {href} = this.props;
    window.location = href;
  }
});

module.exports = LinkButton;
