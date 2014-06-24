/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var ElementMixin = require('./ElementMixin');

var Divider = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    return (
      <div className="rex-forms-Element rex-forms-Divider">
        <hr />
      </div>
    );
  }
});

module.exports = Divider;
