/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var localized = require('../localized');

var ItemLabel = React.createClass({

  render: function() {
    return this.transferPropsTo(
      <div className="rex-forms-ItemLabel">
        <localized formatter={this.props.formatter} className="rex-forms-ItemLabel__label">
          {this.props.label}
        </localized>
        {!this.props.hideHelp && (
          <localized className="rex-forms-ItemLabel__help">
            {this.props.help}
          </localized>
        )}
      </div>
    );
  }
});

module.exports = ItemLabel;
