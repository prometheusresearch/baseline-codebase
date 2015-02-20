/**
 * @copyright Prometheus Research, LLC
 */

var React             = require('react/addons');
var ReactForms        = require('react-forms');
var Message           = require('react-forms/lib/Message');
var cloneWithProps    = React.addons.cloneWithProps;
var cx                = React.addons.classSet;
var {Box}             = require('../layout');
var FormContextMixin  = require('./FormContextMixin');

var Fieldset = React.createClass({
  mixins: [FormContextMixin],

  render() {
    var {label, hint, fieldset, className, ...props} = this.props;
    var value = this.getValue();
    className = cx('rw-Fieldset', className);
    var {node, validation, hasDirty, externalValidation} = value;
    var isInvalid = hasDirty && (validation.isFailure || externalValidation.isFailure);
    console.log(validation.isFailure, hasDirty, validation);
    return (
      <Box {...props} className={className}>
        <ReactForms.Label
          className="rw-Fieldset__label"
          label={label || value.node.props.get('label')}
          hint={hint || value.node.props.get('hint')}
          />
        <Box size={1} className="rw-Fieldset__fieldset">
          {fieldset()}
          {validation.isFailure && hasDirty &&
            <Message>{validation.error}</Message>}
          {externalValidation.isFailure &&
            <Message>{externalValidation.error}</Message>}
        </Box>
      </Box>
    );
  },

  getDefaultProps() {
    return {valueKey: []};
  }
});

module.exports = Fieldset;
