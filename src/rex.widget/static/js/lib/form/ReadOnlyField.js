/**
 * @copyright Prometheus Research, LLC
 */

var React             = require('react/addons');
var cx                = React.addons.classSet;
var ReactForms        = require('react-forms');
var Element           = require('../layout/Element');
var FormContextMixin  = require('./FormContextMixin');

var ReadOnlyField = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {className, label, hint, ...props} = this.props;
    var value = this.getValue();
    return (
      <Element {...props} className={cx('rw-ReadOnlyField', className)}>
        <ReactForms.Label
          label={label}
          hint={hint}
          />
        <div>{value.value}</div>
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

module.exports = ReadOnlyField;
