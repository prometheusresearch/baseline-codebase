/**
 * @copyright Prometheus Research, LLC
 */

var React             = require('react/addons');
var cx                = React.addons.classSet;
var ReactForms        = require('react-forms');
var {Box, HBox}       = require('../layout');
var FormContextMixin  = require('./FormContextMixin');

var ReadOnlyField = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {compact, className, label, hint, ...props} = this.props;
    var value = this.getValue();
    if (compact) {
      return (
        <HBox {...props} className={cx('rw-ReadOnlyField', className)}>
          <Box size={1}>
            <ReactForms.Label
              label={label}
              hint={hint}
              />
          </Box>
          <Box size={3}>
            {value.value}
          </Box>
        </HBox>
      );
    } else {
      return (
        <Box {...props} className={cx('rw-ReadOnlyField', className)}>
          <ReactForms.Label
            label={label}
            hint={hint}
            />
          <div>{value.value}</div>
        </Box>
      );
    }
  },

  getDefaultProps() {
    return {
      size: 1,
      margin: 10
    }
  }
});

module.exports = ReadOnlyField;
