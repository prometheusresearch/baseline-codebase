/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');
var ReactForms = require('react-forms-old');


var EventFieldset = React.createClass({
  propTypes: {
    value: ReactForms.PropTypes.Value,
    onRemove: React.PropTypes.func
  },

  buildField: function (name, value) {
    var {node, validation, isDirty, externalValidation} = value;
    var isInvalid = validation.isFailure || externalValidation.isFailure;

    var classes = {
      'rfb-event-field': true,
      'rf-Field': true,
      'rf-Field--invalid': isInvalid,
      'rf-Field--dirty': isDirty,
      'rf-Field--required': node.props.get('required')
    };
    classes['rfb-event-field-' + name] = true;
    classes = classNames(classes);

    return (
      <tr
        className={classes}
        key={name}>
        <td>
          <ReactForms.Label
            label={value.node.props.get('label')}
            />
        </td>
        <td>
          <ReactForms.Element
            value={value}
            noLabel={true}
            />
        </td>
      </tr>
    );
  },

  render: function () {
    var {value, className} = this.props;
    var {node, validation, isDirty, externalValidation} = value;
    var isInvalid = validation.isFailure || externalValidation.isFailure;

    var classes = {
      'rf-Fieldset': true,
      'rf-Fieldset--invalid': isInvalid,
      'rf-Fieldset--dirty': isDirty,
      'rf-Fieldset--required': node.props.get('required')
    };
    if (className) {
      classes[className] = true;
    }
    classes = classNames(classes);

    return (
      <tr className="rfb-event-fieldset">
        <td>
          <table className="rfb-event">
            <tbody>
              {this.buildField('action', value.get('action'))}
              {this.buildField('trigger', value.get('trigger'))}
              {this.buildField('targets', value.get('targets'))}
              {this.buildField('text', value.get('options').get('text'))}
              {this.buildField('enumerations', value.get('options').get('enumerations'))}
            </tbody>
          </table>
          {validation.isFailure &&
            <ReactForms.Message>{validation.error}</ReactForms.Message>
          }
          {externalValidation.isFailure &&
            <ReactForms.Message>{externalValidation.error}</ReactForms.Message>
          }
        </td>
        <td>
          <button
            onClick={this.props.onRemove}
            className="rf-RepeatingFieldset__remove">
            &times;
          </button>
        </td>
      </tr>
    );
  }
});


module.exports = EventFieldset;

