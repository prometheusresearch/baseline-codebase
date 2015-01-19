/**
 * <CheckboxField />
 */

var React = require('react/addons');
var cx = React.addons.classSet;
var FieldBase = require('./FieldBase');

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
    var {autosize, className, allowEmpty, options, ...props} = this.props;
    var input = (
      <Select
        className="rw-SelectField__select"
        allowEmpty={allowEmpty}
        options={options}
        />
    );
    return (
      <FieldBase
        {...props}
        className={cx('rw-SelectField', className)}
        input={input}
        />
    );
  }
});

module.exports = SelectField;
