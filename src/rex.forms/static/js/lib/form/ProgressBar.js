/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var _     = require('../localization')._;

var ProgressBar = React.createClass({
  propTypes: {
    percentComplete: React.PropTypes.number.isRequired,
    label: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      label: null
    };
  },

  render: function () {
    var style = {width: this.props.percentComplete + '%'};
    var message = _(
      '%(percent)s%% complete',
      {percent: this.props.percentComplete}
    );

    return (
      <div className="rex-forms-ProgressBar" title={message}>
        <span className="rex-forms-ProgressBar__label">{this.props.label}</span>
        <div className="rex-forms-ProgressBar__bar" style={style}></div>
      </div>
    );
  }
});


module.exports = ProgressBar;

