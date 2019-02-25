/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {
  Label,
  defaultValue,
  Message,
  PropTypes: FormPropTypes
} = require('react-forms-old');

var ParameterFieldset = require('./ParameterFieldset');
var _ = require('../../i18n').gettext;


var RepeatingParameter = React.createClass({
  propTypes: {
    value: FormPropTypes.Value,
    label: React.PropTypes.string,
    hint: React.PropTypes.string
  },

  buildParameters: function () {
    return this.props.value.map((value, key) => {
      return (
        <ParameterFieldset
          key={key}
          value={value}
          onRemove={this.onRemove.bind(null, key)}
          />
      );
    });
  },

  render: function () {
    var {label, hint, value} = this.props;
    var {validation, externalValidation} = value;
    var parameters = this.buildParameters();

    return (
      <div className="rfb-repeating-parameter-fieldset">
        <Label
          className="rf-RepeatingFieldset__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        <table>
          <tbody>
            {parameters}
          </tbody>
        </table>
        {validation.isFailure &&
          <Message>{validation.error}</Message>
        }
        {externalValidation.isFailure &&
          <Message>{externalValidation.error}</Message>
        }
        <button
          onClick={this.onAdd}
          className="rf-RepeatingFieldset__add">
          {_('Add Parameter')}
        </button>
      </div>
    );
  },

  onAdd: function (event) {
    event.preventDefault();
    var newIdx = this.props.value.size;
    var valueToAdd = defaultValue(this.props.value.node.get(newIdx));
    this.props.value.transform(value => value.push(valueToAdd));
  },

  onRemove: function (index, event) {
    event.preventDefault();
    this.props.value.transform(value => value.splice(index, 1));
  },

  getItemByIndex: function (index) {
    return this.refs[index];
  }
});


module.exports = RepeatingParameter;

