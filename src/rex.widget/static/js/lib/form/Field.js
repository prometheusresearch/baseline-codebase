/**
 * <Field />
 */

var React               = require('react/addons');
var cx                  = React.addons.classSet;
var ReactForms          = require('react-forms');
var evaluateExpression  = require('./evaluateExpression');
var FormContextMixin    = require('./FormContextMixin');
var Element             = require('../layout/Element');

var Field = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {value, className, disableIf, ...props} = this.props;
    var disable = disableIf && evaluateExpression(disableIf, value);
    return (
      <Element {...props} className={cx('rw-Field', className)}>
        <ReactForms.Field 
          value={value.getIn(this.getValueKey())}
          input={<input disabled={disable} type="text" />}
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

module.exports = Field;
