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
    var {
      className, allowEmpty,
      options, data,
      ...props
    } = this.props;
    var options = []
      .concat(options)
      .concat(data && data.data.map(this._formatData))
      .filter(Boolean);
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
  },

  _formatData(option) {
    var {nameAttribute, valueAttribute} = this.props;
    nameAttribute = nameAttribute || 'title';
    valueAttribute = valueAttribute || 'id';
    return {
      name: option[nameAttribute],
      value: option[valueAttribute]
    };
  }
});

module.exports = SelectField;
