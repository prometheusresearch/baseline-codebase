/**
 * <CheckboxField />
 */
'use strict';

var React             = require('react/addons');
var cx                = React.addons.classSet;
var ReactForms        = require('react-forms');
var Checkbox          = require('react-forms/lib/Checkbox');
var Element           = require('../layout/Element');
var FormContextMixin  = require('./FormContextMixin');

var CheckboxField = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {value, className, ...props} = this.props;
    return (
      <Element {...props} className={cx('rw-CheckboxField', className)}>
        <ReactForms.Field
          value={value.getIn(this.getValueKey())}
          input={<Checkbox className="rw-CheckboxField__checkbox" />}
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

module.exports = CheckboxField;
