/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactCreateClass = require('create-react-class');
var PropTypes = require('prop-types');
var classNames = require('classnames');
var ReactForms = require('react-forms-old');


var ParameterFieldset = ReactCreateClass({
  propTypes: {
    value: ReactForms.PropTypes.Value,
    onRemove: PropTypes.func
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
      <tr>
        <td className="rfb-table-field-short">
          <ReactForms.Element
            value={value.get('id')}
            />
        </td>
        <td className="rfb-table-field-long">
          <ReactForms.Element
            value={value.get('type')}
            />
        </td>
        <td className="rfb-table-field-short">
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


module.exports = ParameterFieldset;

