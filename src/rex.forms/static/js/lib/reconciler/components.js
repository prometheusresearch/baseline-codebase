/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';


var React = require('react/addons');
var classSet = React.addons.classSet;
var Forms = require('react-forms');
var FormFor = Forms.FormFor;

var determineWidgetType = require('../elements/Question').determineWidgetType;
var merge = require('../utils').merge;
var widgetMap = require('../widgets').defaultWidgetMap;
var l10n = require('../localization');
var _ = l10n._;


var HeaderColumn = React.createClass({
  propTypes: {
    label: React.PropTypes.string.isRequired,
    hint: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      hint: ''
    };
  },

  render: function () {
    return (
      <div className="rex-forms-ReconcilerHeaderColumn">
        <p title={this.props.hint}>
          {this.props.label}
        </p>
      </div>
    );
  }
});


var Header = React.createClass({
  propTypes: {
    entries: React.PropTypes.array.isRequired
  },

  buildColumns: function (entries) {
    var columns = entries.map(function (entry) {
      return (
        <HeaderColumn
          key={entry.uid}
          label={entry.uid}
          hint={_('Entered By: %(user)s', {user: entry.modified_by})} />
      );
    });

    columns.push(
      <HeaderColumn
        key='_fv'
        label={_('Final Value')} />
    );

    return columns;
  },

  render: function () {
    var columns = this.buildColumns(this.props.entries),
      classes = {
        'rex-forms-ReconcilerHeader': true
      };
    classes['num-choices-' + this.props.entries.length] = true;
    classes = classSet(classes);

    return (
      <div className={classes}>
        {columns}
      </div>
    );
  }
});


var DiscrepancyTitle = React.createClass({
  propTypes: {
    title: React.PropTypes.string.isRequired
  },

  render: function () {
    return (
      <div className="rex-forms-Discrepancy__title">
        <p>{this.props.title}</p>
      </div>
    );
  }
});


var DiscrepancyChoices = React.createClass({
  mixins: [
    l10n.LocalizedMixin
  ],

  propTypes: {
    discrepancy: React.PropTypes.object.isRequired,
    question: React.PropTypes.object.isRequired,
    onSelect: React.PropTypes.func.isRequired
  },

  getInitialState: function () {
    return {
      selectedEntry: null
    };
  },

  getColumnSizeClass: function () {
    return 'num-choices-' + Object.keys(this.props.discrepancy).length;
  },

  decodeValue: function (value) {
    if (!value) { return value; }
    value = value.toString();
    var enumerations = this.props.question.enumerations;
    if (enumerations) {
      for (var i = 0; i < enumerations.length; i += 1) {
        if (enumerations[i].id === value) {
          return this.localize(enumerations[i].text);
        }
      }
    }
    return value;
  },

  buildValues: function (discrepancy) {
    var values = Object.keys(discrepancy).sort().map((key) => {
      var value = this.decodeValue(discrepancy[key]);
      var classes = {
        'rex-forms-DiscrepancyValues__choice': true,
        'rex-forms-DiscrepancyValues__choice--active': (
          this.state.selectedEntry === key
        ),
        'rex-forms-DiscrepancyValues__choice--novalue': value ? false : true
      };
      classes[this.getColumnSizeClass()] = true;
      classes = classSet(classes);

      var clickHandler = function () {
        this.setState({
          selectedEntry: key
        });
        this.props.onSelect(key);
      }.bind(this);

      return (
        <div key={key} className={classes}>
          <p onClick={clickHandler}>{value || _('No value provided.')}</p>
        </div>
        );
    });

    return values;
  },

  render: function () {
    var values = this.buildValues(this.props.discrepancy),
      classes = 'rex-forms-DiscrepancyValues__input '
        + this.getColumnSizeClass();
    return (
      <div className="rex-forms-DiscrepancyValues">
        {values}
        <div key='_fv' className={classes}>
          {this.props.children}
        </div>
      </div>
    );
  }
});


var SimpleDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldMixin,
    l10n.LocalizedMixin
  ],

  onSelect: function (entryUid) {
    var value = this.value(),
      discrepancy = value.schema.props.discrepancy,
      choice = discrepancy[entryUid];

    choice = value.updateSerialized(choice ? choice.toString() : choice);
    this.onValueUpdate(choice);
  },

  render: function () {
    var schema = this.value().schema,
      question = schema.props.question,
      discrepancy = schema.props.discrepancy;

    var widget = determineWidgetType(
      schema.props.instrumentType.rootType,
      question
    );
    widget = widgetMap[widget](merge(
      this.props,
      {
        options: question,
        noLabel: true
      }
    ));

    return (
      <div className="rex-forms-ReconcilerSection rex-forms-Discrepancy">
        <div className="rex-forms-Discrepancy__inner">
          <DiscrepancyTitle
            title={this.localize(question.text)} />
          <DiscrepancyChoices
            discrepancy={discrepancy}
            question={question}
            onSelect={this.onSelect}>
            {widget}
          </DiscrepancyChoices>
        </div>
      </div>
    );
  }
});


var RecordListDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    l10n.LocalizedMixin
  ],

  render: function () {
    var schema = this.value().schema,
      question = schema.props.question,
      children = Object.keys(schema.children).map((key) => {
        return (
          <FormFor
            key={key}
            name={key}
          />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-RecordListDiscrepancy'>
        <div className='rex-forms-RecordListDiscrepancy__inner'>
          <DiscrepancyTitle
            title={this.localize(question.text)} />
          {children}
        </div>
      </div>
    );
  }
});


var RecordListRecordDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    l10n.LocalizedMixin
  ],

  render: function () {
    var schema = this.value().schema,
      title = _('Record #%(recordNumber)s', {
        recordNumber: parseInt(this.props.name) + 1
      }),
      children = Object.keys(schema.children).map((key) => {
        return (
          <FormFor
            key={key}
            name={key}
          />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-RecordListRecordDiscrepancy'>
        <div className='rex-forms-RecordListRecordDiscrepancy__inner'>
          <DiscrepancyTitle
            title={title} />
          {children}
        </div>
      </div>
    );
  }
});


var MatrixDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    l10n.LocalizedMixin
  ],

  render: function () {
    var schema = this.value().schema,
      question = schema.props.question,
      children = Object.keys(schema.children).map((key) => {
        return (
          <FormFor
            key={key}
            name={key}
          />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-MatrixDiscrepancy'>
        <div className='rex-forms-MatrixDiscrepancy__inner'>
          <DiscrepancyTitle
            title={this.localize(question.text)} />
          {children}
        </div>
      </div>
    );
  }
});


var MatrixRowDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    l10n.LocalizedMixin
  ],

  render: function () {
    var schema = this.value().schema,
      title = this.localize(schema.props.row.text),
      children = Object.keys(schema.children).map((key) => {
        return (
          <FormFor
            key={key}
            name={key}
          />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-MatrixRowDiscrepancy'>
        <div className='rex-forms-MatrixRowDiscrepancy__inner'>
          <DiscrepancyTitle
            title={title} />
          {children}
        </div>
      </div>
    );
  }
});


var DiscrepancyList = React.createClass({
  mixins: [
    Forms.FormMixin
  ],

  isValid: function () {
    var validation = this.value().validation;
    return Forms.validation.isSuccess(validation);
  },

  getReconciledDiscrepancies: function () {
    var collectedValues = this.value().value,
      schema = this.value().schema;

    function fillMissing(target, schema) {
      for (var fieldId in schema.children) {
        var child = schema.children[fieldId];

        if (Forms.schema.isProperty(child)) {
          if (!target.hasOwnProperty(fieldId)) {
            target[fieldId] = null;
          }

        } else if (Forms.schema.isSchema(child)) {
          if (!target.hasOwnProperty(fieldId)) {
            target[fieldId] = {};
          }
          fillMissing(target[fieldId], child);
        }
      }

      return target;
    }

    return fillMissing(collectedValues, schema);
  },

  render: function () {
    return (
      <FormFor />
    );
  }
});


module.exports = {
  Header: Header,
  DiscrepancyList: DiscrepancyList,
  SimpleDiscrepancy: SimpleDiscrepancy,
  RecordListDiscrepancy: RecordListDiscrepancy,
  RecordListRecordDiscrepancy: RecordListRecordDiscrepancy,
  MatrixDiscrepancy: MatrixDiscrepancy,
  MatrixRowDiscrepancy: MatrixRowDiscrepancy
};

