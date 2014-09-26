/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var MultiLineText = React.createClass({
  propTypes: {
    text: React.PropTypes.string.isRequired
  },

  formatText: function (text) {
    return text.toString().replace(/\r?\n/g, '<br/>');
  },

  render: function () {
    return (
      <div
        className="rex-forms-MultiLineText"
        dangerouslySetInnerHTML={{__html: this.formatText(this.props.text)}}
        />
    );
  }
});


module.exports = MultiLineText;

