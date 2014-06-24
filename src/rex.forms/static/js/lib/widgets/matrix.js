/**
 * @jsx React.DOM
 */
'use strict';

var React                   = require('react');
var cx                      = React.addons.classSet;
var ReactForms              = require('react-forms');
var LabelRenderingMixin     = require('./LabelRenderingMixin');
var SelfErrorRenderingMixin = require('./SelfErrorRenderingMixin');
var matrixHeaderRow         = require('./matrixHeaderRow');
var matrixRow               = require('./matrixRow');
var DirtyState              = require('./DirtyState');

/**
 * Matrix
 */
var matrix = React.createClass({

  mixins: [
    ReactForms.FieldsetMixin,
    LabelRenderingMixin,
    SelfErrorRenderingMixin,
    DirtyState
  ],

  render: function() {
    var error = this.renderError();

    var className = cx(
      'rex-forms-Widget',
      'rex-forms-Widget-' + this.props.name,
      'rex-forms-matrix',
      'rex-forms-matrix-' + this.props.name,
      error ? 'rex-forms-Widget--error' : null,
      error ? 'rex-forms-matrix--error' : null
    );

    var questions = this.props.options.questions;
    var rows = this.props.options.rows.map((row) =>
      <matrixRow
        key={row.id}
        name={row.id}
        dirty={this.isDirty()}
        onDirty={this.markDirty}
        row={row}
        questions={questions}
        />
    );
    return (
      <div className={className}>
        {this.renderLabel()}
        {this.renderHelp()}
        <matrixHeaderRow
          questions={questions}
          columns={this.value().schema.props.columns}
          />
        {rows}
        {error}
      </div>
    );
  },

  getInitialDirtyState: function() {
    return false;
  }
});

module.exports = matrix;
