/**
 * @copyright Prometheus Research, LLC
 */

var React             = require('react/addons');
var ReactForms        = require('react-forms');
var cloneWithProps    = React.addons.cloneWithProps;
var cx                = React.addons.classSet;
var {Box}             = require('../layout');
var FormContextMixin  = require('./FormContextMixin');

var Fieldset = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {value, valueKey, label, hint, fieldset, className, ...props} = this.props;
    value = value.getIn(valueKey);
    className = cx('rw-Fieldset', className);
    return (
      <Box {...props} className={className}>
        <ReactForms.Label
          className="rw-Fieldset__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        <Box className="rw-Fieldset__fieldset">
          {fieldset()}
        </Box>
      </Box>
    );
  },

  getDefaultProps() {
    return {valueKey: []};
  }
});

module.exports = Fieldset;
