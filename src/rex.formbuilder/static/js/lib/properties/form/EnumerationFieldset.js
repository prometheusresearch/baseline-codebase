/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var classSet = React.addons.classSet;
var ReactForms = require('react-forms');


var EnumerationFieldset = React.createClass({
  propTypes: {
    value: ReactForms.PropTypes.Value,
    onRemove: React.PropTypes.func
  },

  buildFields: function () {
    return this.props.value.map((value, key) => {
      return (
        <td
          className={'rfb-enumeration-field rfb-enumeration-field-' + key}
          key={key}>
          <ReactForms.Element
            value={value}
            />
        </td>
      );
    });
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
    classes = classSet(classes);

    return (
      <tr>
        {this.buildFields()}
        <td>
          <button
            onClick={this.props.onRemove}
            className='rf-RepeatingFieldset__remove'>
            &times;
          </button>
        </td>
      </tr>
    );
  }
});


module.exports = EnumerationFieldset;

