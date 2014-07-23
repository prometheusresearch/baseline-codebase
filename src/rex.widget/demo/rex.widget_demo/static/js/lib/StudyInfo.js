/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var StudyInfo = React.createClass({

  render: function() {
    var contents;
    if (this.props.data.data) {
      contents = (
        <div className="rex-widget-demo-StudyInfo__study">
          {Object.keys(this.props.data.data).map((name) =>
            <InfoItem name={name} value={this.props.data.data[name]} />)}
        </div>
      );
    } else {
      contents = (
        <div className="rex-widget-demo-StudyInfo__message">
          No study is selected, select one above.
        </div>
      );
    }
    return (
      <div className="rex-widget-demo-StudyInfo">
        <h2>Study Information</h2>
        {contents}
      </div>
    );
  }
});

var InfoItem = React.createClass({

  render: function() {
    return (
      <div className="rex-widget-demo-InfoItem">
        <span className="rex-widget-demo-InfoItem__name">{this.props.name}:</span>
        <span className="rex-widget-demo-InfoItem__value">{this.props.value}</span>
      </div>
    );
  }
});

module.exports = StudyInfo;
