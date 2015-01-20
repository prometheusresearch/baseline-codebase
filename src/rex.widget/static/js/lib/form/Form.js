/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var React             = require('react/addons');
var ReactForms        = require('react-forms');
var cloneWithProps    = React.addons.cloneWithProps;
var cx                = React.addons.classSet;
var {Box}             = require('../layout');
var Fieldset          = require('./Fieldset');
var FormContextMixin  = require('./FormContextMixin');

var Form = React.createClass({
  mixins: [FormContextMixin],

  propTypes: {
    value: React.PropTypes.instanceOf(ReactForms.Value),
    fieldset: React.PropTypes.func,
    className: React.PropTypes.string,
    Fieldset: React.PropTypes.any
  },

  render() {
    var {
      id, value, label, hint, fieldset,
      className, Fieldset, controls,
      ...props
    } = this.props;
    return (
      <Box {...props} className={cx('rw-Form', className)}>
        <Fieldset
          label={label}
          hint={hint}
          fieldset={fieldset}
          className="rw-Form__fieldset"
          size={1}
          value={value}
          />
        <div className="rw-Form__controls">
          {controls}
        </div>
      </Box>
    );
  },

  getDefaultProps() {
    return {Fieldset};
  }

});

module.exports = Form;
