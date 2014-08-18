/**
 * @jsx React.DOM
 */
'use strict';

var React        = require('react');
var ElementMixin = require('./ElementMixin');

var RawValueDisplay = React.createClass({
  mixins: [ElementMixin],

  render: function () {
    var value = JSON.stringify(this.props.value.value, null, '  ');
    var serialized = JSON.stringify(this.props.value.serialized, null, '  ');
    var validation = JSON.stringify(this.props.value.validation, null, '  ');
    var schema = JSON.stringify(this.props.value.schema, null, '  ');

    return (
      <div className="rex-forms-Element rex-forms-RawValueDisplay">
        <h3>Current Value</h3>
        <pre>
          {value}
        </pre>

        <h3>Current Serialized Value</h3>
        <pre>
          {serialized}
        </pre>

        <h3>Current Validation State</h3>
        <pre>
          {validation}
        </pre>

        <h3>Schema</h3>
        <pre>
          {schema}
        </pre>
      </div>
    );
  }
});

module.exports = RawValueDisplay;

