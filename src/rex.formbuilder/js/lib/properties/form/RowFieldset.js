/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classNames = require('classnames');
var ReactForms = require('react-forms');


var RowFieldset = React.createClass({
  propTypes: {
    value: ReactForms.PropTypes.Value,
    onRemove: React.PropTypes.func
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
          <ReactForms.Element
            value={value.get('required')}
            />
        </td>
        <td className="rfb-table-field-long">
          <ReactForms.Element
            value={value.get('text')}
            />
        </td>
        <td className="rfb-table-field-long">
          <ReactForms.Element
            value={value.get('help')}
            />
          <ReactForms.Element
            value={value.get('audio')}
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


module.exports = RowFieldset;

