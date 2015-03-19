/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react/addons');
var cloneWithProps      = React.addons.cloneWithProps;
var emptyFunction       = require('../emptyFunction');
var BaseForm            = require('../_forms/Form');
var Value               = require('../_forms/Value');
var Button              = require('../Button');
var {VBox, HBox}        = require('../Layout');
var Port                = require('../Port');
var Query               = require('../Query');
var NotificationCenter  = require('../NotificationCenter');

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
      onSubmitComplete: emptyFunction,
      onSubmitError: emptyFunction,
      progressNotification: (
        <NotificationCenter.Notification
          kind="info"
          text="Data saving is in progress"
          icon="cog"
          ttl={Infinity}
          />
      ),
      completeNotification: (
        <NotificationCenter.Notification
          kind="success"
          text="Data saved successfully"
          icon="ok"
          />
      ),
      errorNotification: (
        <NotificationCenter.Notification
          kind="danger"
          text="There was an error whild submitting data to server"
          icon="remove"
          />
      )
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
    var nextValue = value.set(
      onSubmit({...submitTo.produceParams().toJS(), ...value.value}),
      false);
    if (nextValue.allErrors) {
      this.setState({value: value.setParams({forceShowErrors: true})});
      return;
    }
    this._progressNotification = NotificationCenter.showNotification(this.props.progressNotification);
    this.setState({submitInProgress: true});
    if (submitTo.port instanceof Port) {
      if (this.props.insert) {
        submitTo.port.insert(nextValue.value).then(this.onSubmitComplete, this.onSubmitError);
      } else {
        submitTo.port.update(nextValue.value).then(this.onSubmitComplete, this.onSubmitError);
      }
    } else if (submitTo.port instanceof Query) {
      submitTo.port.produce(nextValue.value).then(this.onSubmitComplete, this.onSubmitError);
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
    NotificationCenter.removeNotification(this._progressNotification);
    NotificationCenter.showNotification(this.props.completeNotification);
    this.props.onSubmitComplete()
  },

  onSubmitError() {
    this.setState({submitInProgress: false});
    NotificationCenter.removeNotification(this._progressNotification);
    NotificationCenter.showNotification(this.props.errorNotification);
    this.props.onSubmitError()
  }
});

module.exports = Form;
