/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let React                   = require('react');
let Field                   = require('./Field');
let ReadOnlyField           = require('./ReadOnlyField');

let CheckboxStyle = {
  self: {
    marginTop: 9
  }
};

let Checkbox = React.createClass({

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

/**
 * Renders a <Field> with an <input> of type="checkbox" or
 * if ``readOnly`` is true then renders a <ReadOnlyField>.
 *
 * @public
 */
let CheckboxField = React.createClass({

  propTypes: {
    /**
     * When ``true``, a <ReadOnlyField> is displayed;
     * otherwise an <input type="checkbox" ... /> widget is displayed.
     */
    readOnly: React.PropTypes.bool,

    /**
     * A form value object whose **value** property contains 
     * the initial value of the checkbox.
     */
    formValue: React.PropTypes.object
  },

  render() {
    let {readOnly, formValue, ...props} = this.props;
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
