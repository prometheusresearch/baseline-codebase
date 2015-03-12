/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var {Label, defaultValue, PropTypes: FormPropTypes} = require('react-forms');

var EnumerationFieldset = require('./EnumerationFieldset');
var _ = require('../../i18n').gettext;


var RepeatingEnumeration = React.createClass({
  propTypes: {
    value: FormPropTypes.Value,
    label: React.PropTypes.string,
    hint: React.PropTypes.string
  },

  buildEnumerations: function () {
    return this.props.value.map((value, key) => {
      return (
        <EnumerationFieldset
          key={key}
          value={value}
          onRemove={this.onRemove.bind(null, key)}
          />
      );
    });
  },

  render: function () {
    var {label, hint, value} = this.props;
    var enumerations = this.buildEnumerations();

    return (
      <div className='rfb-repeating-enumeration-fieldset'>
        <Label
          className='rf-RepeatingFieldset__label'
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        <table>
          <thead>
            <tr>
              <th>{_('ID')}</th>
              <th>{_('Label')}</th>
              <th>{_('Help Text (optional)')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enumerations}
          </tbody>
        </table>
        <button
          onClick={this.onAdd}
          className='rf-RepeatingFieldset__add'>
          {_('Add Choice')}
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


module.exports = RepeatingEnumeration;

