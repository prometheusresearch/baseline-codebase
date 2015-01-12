/**
 * <CheckboxField />
 */

var React = require('react/addons');
var cx = React.addons.classSet;
var ReactForms = require('react-forms');
var Checkbox = require('react-forms/lib/Checkbox');
var Element = require('../layout/Element');

var Select = React.createClass({

  render() {
    var {options, allowEmpty, ...props} = this.props;
    options = options.map(option =>
      <option key={option.value} value={option.value}>
        {option.name || option.value}
      </option>);
    if (allowEmpty) {
      options.unshift(<option key="__empty__" />);
    }
    return (
      <select {...props}>
        {options}
      </select>
    );
  }
});

var SelectField = React.createClass({

  render() {
    var {value, className, options, allowEmpty, ...props} = this.props;
    return (
      <Element {...props} className={cx('rw-Field', className)}>
        <ReactForms.Field 
          value={value.getIn(this.getValueKey())}
          input={
            <Select
              className="rw-SelectField__select"
              allowEmpty={allowEmpty}
              options={options}
              />
          }
          />
      </Element>
    );
  },

  getDefaultProps() {
    return {
      size: 1,
      margin: 10
    }
  }
});

module.exports = SelectField;
