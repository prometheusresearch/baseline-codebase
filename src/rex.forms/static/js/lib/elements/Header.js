/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var ElementMixin = require('./ElementMixin');

var Header = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    var text = this.localize(this.props.options.text);

    return (
      <div className="rex-forms-Element rex-forms-Header">
        <h2>{text}</h2>
      </div>
    );
  }
});

module.exports = Header;
