/**
 * Copyright (c) 2014, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';


var React = require('react/addons');
var classSet = React.addons.classSet;
var cloneWithProps = React.addons.cloneWithProps;
var Forms = require('react-forms');
var FormFor = Forms.FormFor;

var determineWidgetType = require('../elements/Question').determineWidgetType;
var WidgetConfiguration = require('../form/WidgetConfiguration');
var utils = require('../utils');
var widgetMap = require('../widgets').defaultWidgetMap;
var _ = require('../localization')._;
var types = require('../types');
var localized = require('../localized');


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
    title: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.object
    ]),
    required: React.PropTypes.bool,
    complete: React.PropTypes.bool
  },

  getDefaultProps: function () {
    return {
      required: false,
      complete: false
    };
  },

  render: function () {
    var classes = classSet({
      'rex-forms-Discrepancy__title': true,
      'rex-forms-Discrepancy__required': this.props.required
    });
    return (
      <div className={classes}>
        <p className="title">
          <localized>{this.props.title}</localized>
          {this.props.complete &&
            <span className="rex-forms-Discrepancy__complete"></span>
          }
        </p>
        {this.props.subtitle &&
          <p className="subtitle">{this.props.subtitle}</p>
        }
      </div>
    );
  }
});


var POSITION_TOP = 1 / 3;
var POSITION_BOTTOM = 2 / 3;

function makePositionDescription(position) {
  var desc = '';
  var vars = {
    page: position.page_number + 1,
    field: position.id
  };

  if (position.page_elements < 3) {
    desc = _('On Page %(page)s (%(field)s)', vars);
  } else {
    var relative_position = position.position_on_page / position.page_elements;
    if (relative_position <= POSITION_TOP) {
      desc = _('Top of Page %(page)s (%(field)s)', vars);
    } else if (relative_position >= POSITION_BOTTOM) {
      desc = _('Bottom of Page %(page)s (%(field)s)', vars);
    } else {
      desc = _('Middle of Page %(page)s (%(field)s)', vars);
    }
  }

  return desc;
}


var DiscrepancyChoices = React.createClass({
  propTypes: {
    discrepancy: React.PropTypes.object.isRequired,
    question: React.PropTypes.object.isRequired,
    onSelect: React.PropTypes.func.isRequired,
    targetWidget: React.PropTypes.component.isRequired,
    onStatus: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      selectedEntry: null,
      overridden: false
    };
  },

  getColumnSizeClass: function () {
    return 'num-choices-' + Object.keys(this.props.discrepancy).length;
  },

  decodeValue: function (value) {
    if (value === null) { return value; }

    if (!Array.isArray(value)) {
      value = [value.toString()];
    }

    var enumerations = this.props.question.enumerations;

    return value.map((part, idx) => {
      if (enumerations) {
        for (var i = 0; i < enumerations.length; i += 1) {
          if (enumerations[i].id === part) {
            return (
              <localized
                key={idx}
                className="rex-forms-DiscrepancyValues__choice--value">
                {enumerations[i].text}
              </localized>
            );
          }
        }
      }
      return (
        <span
          key={idx}
          className="rex-forms-DiscrepancyValues__choice--value">
          {part}
        </span>
      );
    });
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

      var clickHandler = this.makeChoice.bind(this, false, key);

      return (
        <div key={key} className={classes}>
          <p onClick={clickHandler}>{value || _('No value provided.')}</p>
        </div>
      );
    });

    return values;
  },

  makeChoice: function (doOverride, selectedEntry) {
    selectedEntry = selectedEntry || null;
    this.setState({
      overridden: doOverride,
      selectedEntry: doOverride ? null : selectedEntry
    }, () => {
      if (!doOverride) {
        this.props.onSelect(selectedEntry);
      }
      if (this.props.onStatus) {
        this.props.onStatus(this.isComplete());
      }
    });
  },

  onOverride: function (event) {
    this.makeChoice(event.target.checked);
  },

  isComplete: function () {
    return this.state.overridden || (this.state.selectedEntry !== null);
  },

  render: function () {
    var values = this.buildValues(this.props.discrepancy),
      classes = 'rex-forms-DiscrepancyValues__input '
        + this.getColumnSizeClass();

    var widget = cloneWithProps(this.props.targetWidget, {
      onChange: () => {
        this.setState({
          selectedEntry: null
        }, () => {
          if (this.props.onStatus) {
            this.props.onStatus(this.isComplete());
          }
        });
      },
      disabled: !this.state.overridden
    });

    var overrideClasses = classSet({
      'rex-forms-DiscrepancyValues__override': true,
      'rex-forms-DiscrepancyValues__override--active': this.state.overridden
    });

    return (
      <div className="rex-forms-DiscrepancyValues">
        {values}
        <div key='_fv' className={classes}>
          <div className={overrideClasses}>
            <label>
              <input
                type="checkbox"
                checked={this.state.overridden}
                refs="manualOverride"
                onChange={this.onOverride}
                />
              {_('Manual Override')}
            </label>
          </div>
          {widget}
        </div>
      </div>
    );
  }
});


var SimpleDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldMixin,
    WidgetConfiguration.Mixin
  ],

  propTypes: {
    onStatus: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      complete: false
    };
  },

  onSelect: function (entryUid) {
    var value = this.value(),
      discrepancy = value.schema.props.discrepancy,
      choice = discrepancy[entryUid];

    var type = types.getForInstrumentType(value.schema.props.instrumentType);
    if ((choice === null) || (choice === undefined)) {
      choice = type.getDefaultValue();
    }
    choice = type.serialize(choice);

    choice = value.updateSerialized(choice);
    this.onValueUpdate(choice);
  },

  onChildStatus: function (isComplete) {
    this.setState({
      complete: isComplete
    }, function () {
      if (this.props.onStatus) {
        this.props.onStatus(this.isComplete());
      }
    });
  },

  isValid: function () {
    var validation = this.value().validation;
    return Forms.validation.isSuccess(validation);
  },

  isComplete: function () {
    return this.state.complete && this.isValid();
  },

  getSubtitle: function () {
    if (this.value().schema.props.question.position) {
      return makePositionDescription(
        this.value().schema.props.question.position
      );
    }
    return null;
  },

  render: function () {
    var schema = this.value().schema,
      question = schema.props.question,
      discrepancy = schema.props.discrepancy,
      fieldId = schema.props.name;

    var widget = determineWidgetType(
      this.getWidgetTypes(), this.getReadOnlyWidgetTypes(),
      schema.props.instrumentType.rootType,
      question
    );
    widget = widgetMap[widget](utils.merge(
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
            title={question.text}
            subtitle={this.getSubtitle()}
            required={schema.props.required}
            complete={this.isComplete()}
            />
          <DiscrepancyChoices
            discrepancy={discrepancy}
            question={question}
            onSelect={this.onSelect}
            onStatus={this.onChildStatus}
            targetWidget={widget}>
          </DiscrepancyChoices>
        </div>
      </div>
    );
  }
});


var ParentDiscrepancyMixin = {
  /*
   * Implementers need to provide this function:
   *
  isComplete: function () {
    return aBoolean;
  },
  */

  propTypes: {
    childComparator: React.PropTypes.func
  },

  getDefaultProps: function () {
    return {
      childComparator: undefined
    };
  },

  getInitialState: function () {
    return {
      childFields: [],
      childComparator: this.props.childComparator,
      childStatus: {}
    };
  },

  componentWillMount: function () {
    this._initParentDiscrepancy(this.props, this.value().schema);
  },

  _initParentDiscrepancy: function (props, schema) {
    var children = Object.keys(schema.children).sort(
      this.state.childComparator
    );

    this.setState({
      childFields: children,
      childStatus: children.reduce(function (previous, current) {
        previous[current] = previous[current] || false;
        return previous;
      }, {})
    });
  },

  onChildStatus: function (childID, isComplete) {
    var newStatus = utils.merge(this.state.childStatus, {});
    newStatus[childID] = isComplete;

    this.setState({
      childStatus: newStatus
    }, function () {
      if (this.props.onStatus) {
        this.props.onStatus(this.isComplete());
      }
    });
  },

  areChildrenComplete: function () {
    var childrenStatus = this.state.childFields.reduce((previous, current) => {
      return previous && this.state.childStatus[current];
    }, true);

    return childrenStatus;
  },

  getSubtitle: function () {
    if (this.value().schema.props.question.position) {
      return makePositionDescription(
        this.value().schema.props.question.position
      );
    }
    return null;
  },
};


var RecordListDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    ParentDiscrepancyMixin
  ],

  getInitialState: function () {
    return {
      childComparator: this._recordComparator
    };
  },

  isComplete: function () {
    return this.areChildrenComplete();
  },

  _getFieldIndex: function (fieldID) {
    var question = this.value().schema.props.question;
    var index = 0;

    for (var f = 0; f < question.questions.length; f++) {
      var field = question.questions[f];

      if (field.fieldId === fieldID) {
        return index;
      }

      index += 1;
    }
  },

  _fieldComparator: function (a, b) {
    var aIndex = this._getFieldIndex(a);
    var bIndex = this._getFieldIndex(b);
    return (aIndex - bIndex);
  },

  _recordComparator: function (a, b) {
    return (parseInt(a) - parseInt(b));
  },

  render: function () {
    var schema = this.value().schema,
      question = schema.props.question,
      records = this.state.childFields.map((recordNumber) => {
        return (
          <FormFor
            key={recordNumber}
            name={recordNumber}
            childComparator={this._fieldComparator}
            onStatus={this.onChildStatus.bind(this, recordNumber)}
            />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-RecordListDiscrepancy'>
        <div className='rex-forms-RecordListDiscrepancy__inner'>
          <DiscrepancyTitle
            title={question.text}
            subtitle={this.getSubtitle()}
            required={schema.props.required}
            complete={this.isComplete()}
            />
          {records}
        </div>
      </div>
    );
  }
});


var RecordListRecordDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    ParentDiscrepancyMixin
  ],

  isComplete: function () {
    return this.areChildrenComplete();
  },

  render: function () {
    var schema = this.value().schema,
      title = _('Record #%(recordNumber)s', {
        recordNumber: parseInt(this.props.name) + 1
      }),
      fields = this.state.childFields.map((fieldID) => {
        return (
          <FormFor
            key={fieldID}
            name={fieldID}
            onStatus={this.onChildStatus.bind(this, fieldID)}
            />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-RecordListRecordDiscrepancy'>
        <div className='rex-forms-RecordListRecordDiscrepancy__inner'>
          <DiscrepancyTitle
            title={title}
            required={schema.props.required}
            complete={this.isComplete()}
            />
          {fields}
        </div>
      </div>
    );
  }
});


var MatrixDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    ParentDiscrepancyMixin
  ],

  getInitialState: function () {
    return {
      childComparator: this._comparator.bind(this, this._getRowIndex)
    };
  },

  isComplete: function () {
    return this.areChildrenComplete();
  },

  _getRowIndex: function (rowID) {
    var question = this.value().schema.props.question;
    var index = 0;

    for (var r = 0; r < question.rows.length; r++) {
      var row = question.rows[r];

      if (row.id === rowID) {
        return index;
      }

      index += 1;
    }
  },

  _getColumnIndex: function (columnID) {
    var question = this.value().schema.props.question;
    var index = 0;

    for (var c = 0; c < question.questions.length; c++) {
      var column = question.questions[c];

      if (column.fieldId === columnID) {
        return index;
      }

      index += 1;
    }
  },

  _comparator: function (indexer, a, b) {
    var aIndex = indexer(a);
    var bIndex = indexer(b);
    return (aIndex - bIndex);
  },

  render: function () {
    var schema = this.value().schema,
      question = schema.props.question,
      columnComparator = this._comparator.bind(this, this._getColumnIndex),
      rows = this.state.childFields.map((rowID) => {
        return (
          <FormFor
            key={rowID}
            name={rowID}
            childComparator={columnComparator}
            onStatus={this.onChildStatus.bind(this, rowID)}
            />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-MatrixDiscrepancy'>
        <div className='rex-forms-MatrixDiscrepancy__inner'>
          <DiscrepancyTitle
            title={question.text}
            subtitle={this.getSubtitle()}
            complete={this.isComplete()}
            />
          {rows}
        </div>
      </div>
    );
  }
});


var MatrixRowDiscrepancy = React.createClass({
  mixins: [
    Forms.FieldsetMixin,
    ParentDiscrepancyMixin
  ],

  isComplete: function () {
    return this.areChildrenComplete();
  },

  render: function () {
    var schema = this.value().schema,
      title = schema.props.row.text,
      columns = this.state.childFields.map((columnID) => {
        return (
          <FormFor
            key={columnID}
            name={columnID}
            onStatus={this.onChildStatus.bind(this, columnID)}
            />
        );
      });

    return (
      <div
        className='rex-forms-ReconcilerSection rex-forms-MatrixRowDiscrepancy'>
        <div className='rex-forms-MatrixRowDiscrepancy__inner'>
          <DiscrepancyTitle
            title={title}
            required={schema.props.required}
            complete={this.isComplete()}
            />
          {columns}
        </div>
      </div>
    );
  }
});


var DiscrepancyList = React.createClass({
  mixins: [
    Forms.FormMixin,
    ParentDiscrepancyMixin
  ],

  getInitialState: function () {
    return {
      childComparator: this._fieldComparator
    };
  },

  isValid: function () {
    var validation = this.value().validation;
    return Forms.validation.isSuccess(validation);
  },

  isComplete: function () {
    return this.areChildrenComplete() && this.isValid();
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

  _getSortIndex: function (fieldId) {
    var form = this.props.schema.props.form;
    var index = 0;

    for (var p = 0; p < form.pages.length; p++) {
      var page = form.pages[p];

      for (var e = 0; e < page.elements.length; e++) {
        var element = page.elements[e];

        if ((element.type === 'question')
            && (element.options.fieldId === fieldId)) {
          return index;
        }

        index += 1;
      }
    }

    var unprompted = Object.keys(form.unprompted || {}).sort();
    var unpromptedIndex = unprompted.indexOf(fieldId);
    if (unpromptedIndex >= 0) {
      return (index + unpromptedIndex);
    }
  },

  _fieldComparator: function (a, b) {
    var aIndex = this._getSortIndex(a);
    var bIndex = this._getSortIndex(b);
    return (aIndex - bIndex);
  },

  render: function () {
    var discrepancies = this.state.childFields.map((fieldID) => {
      return (
        <FormFor
          name={fieldID}
          key={fieldID}
          onStatus={this.onChildStatus.bind(this, fieldID)}
          />
      );
    });

    return (
      <div className="rex-forms-ReconcilerDiscrepancyList">
        {discrepancies}
      </div>
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

