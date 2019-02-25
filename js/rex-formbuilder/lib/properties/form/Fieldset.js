/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';


var React = require('react');
var classNames = require('classnames');
var ReactForms = require('react-forms-old');
var {Message, Label, Element} = ReactForms;


var Fieldset = React.createClass({
  propTypes: {
    value: ReactForms.PropTypes.Value,
    label: React.PropTypes.string,
    noLabel: React.PropTypes.bool,
    hint: React.PropTypes.string
  },

  render: function () {
    var {value, className, label, noLabel, hint, ...props} = this.props;
    var {node, validation, isDirty, externalValidation} = value;
    var isInvalid = validation.isFailure || externalValidation.isFailure;

    var classes = {
      'rf-Fieldset': true,
      'rf-Fieldset--invalid': isInvalid,
      'rf-Fieldset--dirty': isDirty,
      'rf-Fieldset--required': node.props.get('required')
    };
    if (className) {
      classes[className] = true;
    }
    classes = classNames(classes, value.node.props.get('className'));

    return (
      <div {...props} className={classes}>
        {!noLabel &&
          <Label
            className="rf-Fieldset__label"
            label={label || value.node.props.get('label')}
            hint={hint || value.node.props.get('hint')}
            />}
        {value.map((value, key) => <Element key={key} value={value} />)}
        {validation.isFailure &&
          <Message>{validation.error}</Message>}
        {externalValidation.isFailure && isDirty &&
          <Message>{externalValidation.error}</Message>}
      </div>
    );
  }
});


module.exports = Fieldset;

