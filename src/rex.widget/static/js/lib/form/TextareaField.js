/**
 * <TextareaField />
 */

var React             = require('react/addons');
var cx                = React.addons.classSet;
var ReactForms        = require('react-forms');
var TextareaAutosize  = require('react-textarea-autosize');
var FormContextMixin  = require('./FormContextMixin');
var Element           = require('../layout/Element');

var TextareaField = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {value, className, autosize, ...props} = this.props;
    var input = autosize ?
      <TextareaAutosize className="rw-TextareaField__textarea" /> :
      <textarea className="rw-TextareaField__textarea" />;
    return (
      <Element {...props} className={cx('rw-Field', className)}>
        <ReactForms.Field
          value={value.getIn(this.getValueKey())}
          input={input}
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

module.exports = TextareaField;
