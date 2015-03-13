/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React           = require('react/addons');
var cloneWithProps  = React.addons.cloneWithProps;
var emptyFunction   = require('../emptyFunction');
var BaseForm        = require('../_forms/Form');
var Value           = require('../_forms/Value');
var Button          = require('../Button');
var {VBox, HBox}    = require('../Layout');
var Port            = require('../Port');
var Query           = require('../Query');

var FormStyle = {
  controls: {
    marginTop: 10
  }
};

var Form = React.createClass({

  render() {
    var {children, schema, submitButton, submitButtonTitle, ...props} = this.props;
    var {value, submitInProgress} = this.state;
    if (submitButton) {
      var submitButtonProps = {
        type: 'button',
        onClick: this.onSubmit,
        disabled: value.params.forceShowErrors && value.allErrors || submitInProgress
      };
      if (submitButtonTitle) {
        submitButtonProps.children = submitButtonTitle;
      }
      submitButton = cloneWithProps(submitButton, submitButtonProps);
    }
    return (
      <VBox>
        <BaseForm {...props} value={value}>
          {children}
        </BaseForm>
        <VBox style={FormStyle.controls}>
          {submitButton}
        </VBox>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      submitButton: (
        <Button success>Submit</Button>
      ),
      onSubmit: emptyFunction.thatReturnsArgument,
      progressNotificationText: 'Data saving is in progress',
      completeNotificationText: 'Data saved successfully',
      errorNotificationText: 'There was an error whild submitting data to server'
    };
  },

  getInitialState() {
    return {
      submitInProgress: false,
      value: Value(this.props.schema, this.props.value, this.onChange)
    };
  },

  submit() {
    var {value} = this.state;
    var {submitTo, onSubmit, onSubmitComplete, onSubmitError} = this.props;
    if (value.allErrors) {
      value = value.setParams({forceShowErrors: true});
      this.setState({value});
      return;
    }
    value = {...submitTo.produceParams().toJS(), ...value.value};
    value = onSubmit(value);
    if (value !== false) {
      this.setState({submitInProgress: true});
      if (submitTo.port instanceof Port) {
        if (this.props.insert) {
          submitTo.port.insert(value).then(this.onSubmitComplete, this.onSubmitError);
        } else {
          submitTo.port.update(value).then(this.onSubmitComplete, this.onSubmitError);
        }
      } else if (submitTo.port instanceof Query) {
        submitTo.port.produce(value).then(this.onSubmitComplete, this.onSubmitError);
      }
    }
  },

  onChange(value) {
    this.setState({value});
  },

  onSubmit(e) {
    e.stopPropagation();
    e.preventDefault();
    this.submit();
  },

  onSubmitComplete() {
    this.setState({submitInProgress: false});
    this.props.onSubmitComplete()
  },

  onSubmitError() {
    this.setState({submitInProgress: false});
    this.props.onSubmitError()
  }
});

module.exports = Form;
