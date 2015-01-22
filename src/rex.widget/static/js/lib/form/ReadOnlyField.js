/**
 * @copyright Prometheus Research, LLC
 */

var React             = require('react/addons');
var cx                = React.addons.classSet;
var ReactForms        = require('react-forms');
var {Box, HBox}       = require('../layout');
var merge             = require('../merge');
var FormContextMixin  = require('./FormContextMixin');

var ReadOnlyField = React.createClass({
  mixins: [FormContextMixin],

  compactLabelStyle: merge(
    Box.makeBoxStyle(),
    {
      textAlign: 'right',
      marginRight: 10
    }
  ),

  render() {
    var {compact, className, label, hint, ...props} = this.props;
    var value = this.getValue();
    if (compact) {
      return (
        <HBox {...props} className={cx('rw-ReadOnlyField', className)}>
          <Box size={1}>
            <ReactForms.Label
              style={this.compactLabelStyle}
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
      margin: 10,
      compact: true
    }
  }
});

module.exports = ReadOnlyField;
