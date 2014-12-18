/**
 * @jsx React.DOM
 */
'use strict';

var React  = require('react');
var cx     = React.addons.classSet;

var InfoMessage = React.createClass({

  getDefaultProps: function () {
    return {
      message: null,
      type: 'info'
    };
  },

  render: function() {
    var classes = {
      'rfb-InfoMessage-text': true,
      'rfb-InfoMessage-error': this.props.type === 'error',
      'rfb-InfoMessage-warning': this.props.type === 'warning',
      'rfb-InfoMessage-info': this.props.type === 'info',
    };
    return (
      <div className="rfb-InfoMessage">
        <div>
          <div className={cx(classes)}>
            {this.props.message}
          </div>
        </div>
      </div>
    );
  }
});

module.exports = InfoMessage;
