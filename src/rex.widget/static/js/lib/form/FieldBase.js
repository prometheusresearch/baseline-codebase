/**
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React               = require('react/addons');
var cx                  = React.addons.classSet;
var Message             = require('react-forms/lib/Message');
var Label               = require('react-forms/lib/Label');
var Input               = require('react-forms/lib/Input');
var merge               = require('../merge');
var {Box, HBox}         = require('../layout');
var FormContextMixin    = require('./FormContextMixin');
var evaluateExpression  = require('./evaluateExpression');

var FieldBase = React.createClass({
  mixins: [FormContextMixin],

  compactLabelStyle: merge(
    Box.makeBoxStyle(),
    {
      textAlign: 'right',
      marginTop: 7,
      marginRight: 10
    }
  ),

  render(): ?ReactElement {
    var {compact, hint, label, noLabel, input, className, disableIf, ...props} = this.props;
    var value = this.getValue();
    var disable = disableIf && evaluateExpression(disableIf, value);
    var {node, validation, isDirty, externalValidation} = value;
    var isInvalid = isDirty && (validation.isFailure || externalValidation.isFailure);

    var classNames = cx({
      'rf-Field': true,
      'rf-Field--invalid': isInvalid,
      'rf-Field--dirty': isDirty,
      'rf-Field--required': node.props.get('required')
    });

    var id = this._rootNodeID;

    if (compact) {
      return (
        <Box {...props} className={cx(classNames, className)}>
          <HBox>
            {!noLabel &&
              <Box size={1}>
                <Label
                  style={this.compactLabelStyle}
                  htmlFor={id}
                  className="rf-Field__label"
                  label={label || node.props.get('label')}
                  hint={hint || node.props.get('hint')}
                  />
              </Box>}
            <Box size={3}>
              <Input
                ref="input"
                id={id}
                disable={disable}
                value={value}
                input={input}
                dirtyOnBlur={node.props.get('dirtyOnBlur', true)}
                dirtyOnChange={node.props.get('dirtyOnChange', true)}
                />
              {validation.isFailure && isDirty &&
                <Message>{validation.error}</Message>}
              {externalValidation.isFailure &&
                <Message>{externalValidation.error}</Message>}
            </Box>
          </HBox>
        </Box>
      );
    } else {
      return (
        <Box {...props} className={cx(classNames, className)}>
          <Box>
            {!noLabel &&
              <Label
                htmlFor={id}
                className="rf-Field__label"
                label={label || node.props.get('label')}
                hint={hint || node.props.get('hint')}
                />}
            <Input
              ref="input"
              id={id}
              disable={disable}
              value={value}
              input={input}
              dirtyOnBlur={node.props.get('dirtyOnBlur', true)}
              dirtyOnChange={node.props.get('dirtyOnChange', true)}
              />
          </Box>
          {validation.isFailure && isDirty &&
            <Message>{validation.error}</Message>}
          {externalValidation.isFailure &&
            <Message>{externalValidation.error}</Message>}
        </Box>
      );
    }
  },

  getDefaultProps() {
    return {
      size: 1,
      margin: 5
    }
  }
});

module.exports = FieldBase;
