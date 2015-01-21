/**
 * @jsx React.DOM
 */
'use strict';

var React     = require('react');
var localized = require('../localized');
var AudioPlayer = require('../AudioPlayer');

var ItemLabel = React.createClass({

  render: function() {
    return this.transferPropsTo(
      <div className="rex-forms-ItemLabel">
        {this.props.audio &&
          <AudioPlayer
            source={this.props.audio}
            showDuration={false}
            />
        }
        <localized
          className="rex-forms-ItemLabel__label">
          {this.props.label}
        </localized>
        {!this.props.hideHelp && this.props.help && (
          <localized className="rex-forms-ItemLabel__help">
            {this.props.help}
          </localized>
        )}
      </div>
    );
  }
});

module.exports = ItemLabel;
