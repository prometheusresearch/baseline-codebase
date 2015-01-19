/**
 * @jsx React.DOM
 */
'use strict';

var React = require('react');

var StudyInfo = React.createClass({

  render() {
    var contents;
    var {data} = this.props;
    if (data && data.data) {
      contents = (
        <div className="rex-widget-demo-StudyInfo__study">
          <InfoItem name="id" value={data.data.id} />
          <InfoItem name="title" value={data.data.title} />
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

  render() {
    return (
      <div className="rex-widget-demo-InfoItem">
        <span className="rex-widget-demo-InfoItem__name">{this.props.name}:</span>
        <span className="rex-widget-demo-InfoItem__value">{this.props.value}</span>
      </div>
    );
  }
});

module.exports = StudyInfo;
