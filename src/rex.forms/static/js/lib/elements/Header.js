/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var ElementMixin = require('./ElementMixin');
var localized    = require('../localized');

var Header = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    return (
      <div className="rex-forms-Element rex-forms-Header">
        <localized
          block={false}
          component={React.DOM.h2}>
          {this.props.options.text}
        </localized>
      </div>
    );
  }
});

module.exports = Header;
