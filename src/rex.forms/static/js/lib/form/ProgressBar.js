/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');
var _     = require('../localization')._;

var ProgressBar = React.createClass({
  propTypes: {
    percentComplete: React.PropTypes.number.isRequired
  },

  render: function () {
    var style = {width: this.props.percentComplete + '%'};
    var message = _(
      '%(percent)s%% complete',
      {percent: this.props.percentComplete});

    return (
      <div className="progress rex-forms-ProgressBar" title={message}>
        <div className="progress-bar" style={style}></div>
      </div>
    );
  }
});


module.exports = ProgressBar;


