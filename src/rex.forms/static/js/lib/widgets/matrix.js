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
var FormEventsMixin         = require('./../form/FormEventsMixin');
var utils                   = require('../utils');

/**
 * Matrix
 */
var matrix = React.createClass({

  mixins: [
    ReactForms.FieldsetMixin,
    LabelRenderingMixin,
    SelfErrorRenderingMixin,
    DirtyState,
    FormEventsMixin
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

    var events = this.formEvents();

    var questions = this.props.options.questions.filter((question) => {
      var rows = this.props.options.rows;

      for (var r = 0; r < rows.length; r++) {
        var val = this.value().get(rows[r].id);
        if (!events.isHidden(question.fieldId, val)) {
          return true;
        }
      }

      return false;
    });

    var rows = this.props.options.rows.map((row) =>
      <matrixRow
        key={row.id}
        ref={row.id}
        name={row.id}
        dirty={this.isDirty()}
        onDirty={this.markDirty}
        disabled={this.props.disabled}
        row={row}
        questions={questions}
        onNext={this.onNext}
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

  getDefaultProps: function() {
    return {onNext: utils.emptyFunction};
  },

  focus: function() {
    if (this.props.options.rows.length > 0) {
      var rowId = this.props.options.rows[0].id;
      this.refs[rowId].focus();
    }
  },

  onNext: function(rowId) {
    var next = utils.findAfter(this.props.options.rows, (row) => row.id, rowId);
    if (next) {
      this.refs[next].focus();
    } else {
      this.props.onNext(this.props.name);
    }
  },

  getInitialDirtyState: function() {
    return false;
  }
});

module.exports = matrix;
