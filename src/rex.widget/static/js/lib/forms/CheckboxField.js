/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var Field                   = require('./Field');
var ReadOnlyField           = require('./ReadOnlyField');

var CheckboxStyle = {
  self: {
    marginTop: 9
  }
};

var Checkbox = React.createClass({

  render() {
    return (
      <input
        type="checkbox"
        style={CheckboxStyle.self}
        checked={this.props.value}
        onChange={this.onChange} 
        />
    );
  },

  onChange(e) {
    this.props.onChange(e.target.checked);
  }
});

var CheckboxField = React.createClass({

  render() {
    var {readOnly, formValue, ...props} = this.props;
    if (readOnly) {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {formValue.value ? 'Yes' : 'No'}
        </ReadOnlyField>
      );
    } else {
      return (
        <Field {...props} formValue={formValue} data={undefined}>
          <Checkbox />
        </Field>
      );
    }
  }
});

module.exports = CheckboxField;
