/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var localized = require('../localized');

var Title = React.createClass({

  propTypes: {
    text: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.object
    ]),
    subtitle: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.object
    ])
  },

  render: function () {
    return (
      <div className="rex-forms-Title">
        <localized
          component={React.DOM.h1}
          className="rex-forms-Title__main">
          {this.props.text}
        </localized>
        {this.props.subtitle &&
          <localized
            component={React.DOM.h2}
            className="rex-forms-Title__subtitle">
            {this.props.subtitle}
          </localized>
        }
      </div>
    );
  }
});

module.exports = Title;
