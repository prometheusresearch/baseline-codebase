/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var {Value}             = require('react-forms');
var Fieldset            = require('./Fieldset');
var emptyFunction       = require('../emptyFunction');
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

/**
 * Form component.
 *
 * @public
 */
var Form = React.createClass({

  propTypes: {
    /**
     * An instance of ``class DataSpecification``.
     * The data specification to submit the form value to.
     */
    submitTo: React.PropTypes.object,
    /**
     * The form schema in json schema format.
     */
    schema: React.PropTypes.object,
    /**
     * Initial form value.
     */
    value: React.PropTypes.object,

    /**
     * Submit button element.
     */
    submitButton: React.PropTypes.element,
    /**
     * Submit button title.
     */
    submitButtonTitle: React.PropTypes.string,

    /**
     * func
     *
     * Callback which fires on form submit.
     *
     * This callback can alter form value before submitting it to server by
     * returning a new value. Value will be revalidated.
     */
    onSubmit: React.PropTypes.func,

    /**
     * func
     *
     * Callback which can be used to transform value before submitting it on
     * server. Value won't be revalidated.
     */
    transformValueOnSubmit: React.PropTypes.func,

    /**
     * func
     *
     * Callback which fires after form submit is complete.
     */
    onSubmitComplete: React.PropTypes.func,
    /**
     * func
     *
     * Callback which fires if form submit results in an error.
     */
    onSubmitError: React.PropTypes.func
  },

  render() {
    var {children, schema, submitButton, submitButtonTitle, ...props} = this.props;
    var {value, submitInProgress} = this.state;
    if (submitButton) {
      var submitButtonProps = {
        type: 'button',
        onClick: this.onSubmit,
        disabled: value.params.forceShowErrors && value.completeErrorList.length > 0 || submitInProgress
      };
      if (submitButtonTitle) {
        submitButtonProps.children = submitButtonTitle;
      }
      submitButton = React.cloneElement(submitButton, submitButtonProps);
    }
    return (
      <VBox>
        <Fieldset {...props} formValue={value}>
          {children}
        </Fieldset>
        {submitButton &&
          <VBox style={FormStyle.controls}>
            <div>
              {submitButton}
            </div>
          </VBox>}
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      submitButton: (
        <Button success>Submit</Button>
      ),
      onChange: emptyFunction.thatReturnsArgument,
      onUpdate: emptyFunction.thatReturnsArgument,
      onSubmit: emptyFunction.thatReturnsArgument,
      onSubmitComplete: emptyFunction,
      onSubmitError: emptyFunction,
      transformValueOnSubmit: emptyFunction.thatReturnsArgument,
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
          text="There was an error while submitting data to server"
          icon="remove"
          ttl={Infinity}
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

  componentDidUpdate() {
    var value = this.props.onUpdate(this.state.value.value);
    if (value !== this.state.value.value) {
      this.setState({value: this.state.value.update(value, true)});
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.schema !== this.props.schema) {
      var value = Value(nextProps.schema, this.state.value.value, this.onChange, this.state.value.params);
      this.setState({value});
    }
  },

  submit() {
    var {value} = this.state;
    var {submitTo, onSubmit, onSubmitComplete, onSubmitError} = this.props;
    var nextValue = value.update(
      onSubmit({...submitTo.produceParams().toJS(), ...value.value}),
      true);
    if (nextValue.completeErrorList.length > 0) {
      this.setState({value: Value(value.schema, value.value, value.onChange, {forceShowErrors: true}, value.completeErrorList)});

      return;
    }
    this._progressNotification = NotificationCenter.showNotification(this.props.progressNotification);
    this.setState({submitInProgress: true});
    var valueToSubmit = this.props.transformValueOnSubmit(nextValue.value);
    if (submitTo.port instanceof Port) {
      if (this.props.insert) {
        submitTo.port.insert(valueToSubmit).then(this.onSubmitComplete, this.onSubmitError);
      } else {
        submitTo.port
          .replace(this.props.initialValue || this.props.value, valueToSubmit)
          .then(this.onSubmitComplete, this.onSubmitError);
      }
    } else if (submitTo.port instanceof Query) {
      submitTo.port.produce(valueToSubmit).then(this.onSubmitComplete, this.onSubmitError);
    }
  },

  onChange(value) {
    value = value.update(this.props.onChange(value.value, this.state.value.value), true);
    this.setState({value});
  },

  onSubmit(e) {
    e.stopPropagation();
    e.preventDefault();
    this.submit();
  },

  onSubmitComplete(data) {
    this.setState({submitInProgress: false});
    NotificationCenter.removeNotification(this._progressNotification);
    NotificationCenter.showNotification(this.props.completeNotification);
    this.props.onSubmitComplete(data)
  },

  onSubmitError(err) {
    this.setState({submitInProgress: false});
    NotificationCenter.removeNotification(this._progressNotification);
    var errorNotification = React.cloneElement(this.props.errorNotification, {
      children: (
        <div>
          <p>Error submitting data on server:</p>
          <ErrorRenderer error={err} />
        </div>
      )
    });
    NotificationCenter.showNotification(errorNotification);
    this.props.onSubmitError()
  }
});

var ErrorRendererStyle = {
  stack: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    overflow: 'auto'
  },
  controls: {
    textAlign: 'right'
  }
};

var ErrorRenderer = React.createClass({

  render() {
    var {error, ...props} = this.props;
    var {showDetails} = this.state;
    return (
      <div {...props}>
        <div>
          {error.message ? error.message : error.toString()}
        </div>
        {error.stack && !showDetails &&
          <div style={ErrorRendererStyle.controls}>
            <Button danger size="small" quiet onClick={this.onClick}>
              Show details
            </Button>
          </div>}
        {error.stack && showDetails &&
          <div style={ErrorRendererStyle.stack}>
            {error.stack}
          </div>}
      </div>
    );
  },

  onClick(e) {
    e.stopPropagation();
    this.setState({showDetails: true});
  },

  getInitialState() {
    return {
      showDetails: false
    };
  }
});

module.exports = Form;
