/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes}       from 'react';
import {createValue} from 'react-forms';
import Fieldset                 from './Fieldset';
import emptyFunction            from '../emptyFunction';
import Button                   from '../Button';
import {VBox}                   from '../Layout';
import {Port}                   from '../data/Port';
import {Query}                  from '../data/Query';
import {Mutation}               from '../data/Mutation';
import {Request}                from '../data/Request';
import * as NotificationCenter  from '../NotificationCenter';

let FormStyle = {
  controls: {
    marginTop: 10
  }
};

/**
 * Form component.
 *
 * @public
 */
let Form = React.createClass({

  propTypes: {

    /**
     * If form should operate in "insert" mode (for creating new entities).
     */
    insert: PropTypes.bool,

    /**
     * Initial form value
     */
    initialValue: PropTypes.any,

    /**
     * Callback which is called on every change to form which results in a valid
     * value.
     */
    onChange: PropTypes.func,

    /**
     * The data specification to submit the form value to.
     */
    submitTo: PropTypes.object,
    /**
     * The form schema in json schema format.
     */
    schema: PropTypes.object,
    /**
     * Initial form value.
     */
    value: PropTypes.object,

    /**
     * Submit button element.
     */
    submitButton: PropTypes.element,
    /**
     * Submit button title.
     */
    submitButtonTitle: PropTypes.string,

    /**
     * func
     *
     * Callback which fires on form submit.
     *
     * This callback can alter form value before submitting it to server by
     * returning a new value. Value will be revalidated.
     */
    onSubmit: PropTypes.func,

    /**
     * func
     *
     * Callback which can be used to transform value before submitting it on
     * server. Value won't be revalidated.
     */
    transformValueOnSubmit: PropTypes.func,

    /**
     * func
     *
     * Callback which fires after form submit is complete.
     */
    onSubmitComplete: PropTypes.func,
    /**
     * func
     *
     * Callback which fires if form submit results in an error.
     */
    onSubmitError: PropTypes.func,

    /**
     * @private
     */
    context: PropTypes.object,

    /**
     * Error notification
     */
    errorNotification: PropTypes.node,

    /**
     * Progress notification
     */
    progressNotification: PropTypes.node,

    /**
     * Complete notification
     */
    completeNotification: PropTypes.node,

    /**
     * Form children
     */
    children: PropTypes.node,

    /**
     * Callback is called on each update.
     */
    onUpdate: PropTypes.func,
  },

  render() {
    let {children, schema, submitButton, submitButtonTitle, ...props} = this.props;
    let {value, submitInProgress} = this.state;
    if (submitButton) {
      let submitButtonProps = {
        type: 'button',
        onClick: this.onSubmit,
        disabled: (
          value.params.forceShowErrors
          && value.completeErrorList.length > 0
          || submitInProgress
        )
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
      value: createValue({
        schema: this.props.schema,
        value: this.props.value,
        onChange: this.onChange,
        params: {context: this.props.context},
      })
    };
  },

  componentDidUpdate() {
    let value = this.props.onUpdate(this.state.value.value);
    if (value !== this.state.value.value) {
      this.setState({ // eslint-disable-line react/no-did-update-set-state
        value: this.state.value.update(value, true)
      });
    }
  },

  componentWillReceiveProps(nextProps) {
    let value = this.state.value;
    if (nextProps.schema !== this.props.schema) {
      value = value.createRoot({
        schema: nextProps.schema,
      });
      this.setState({value});
    }
    if (nextProps.context !== this.props.context) {
      value = value.createRoot({
        params: {...value.params, context: nextProps.context},
      });
      this.setState({value});
    }
  },

  submit() {
    let {value} = this.state;
    let {submitTo, onSubmit, insert} = this.props;

    let nextValue = value;

    if (nextValue.completeErrorList.length > 0) {
      this.setState({
        value: value.createRoot({
          params: {forceShowErrors: true},
        })
      });

      return;
    }
    this._progressNotification = NotificationCenter.showNotification(
      this.props.progressNotification);
    this.setState({submitInProgress: true});
    let valueToSubmit = this.props.transformValueOnSubmit(nextValue.value);
    if (submitTo instanceof Port) {
      if (insert) {
        submitTo
          .insert(valueToSubmit)
          .then(this.onSubmitComplete, this.onSubmitError);
      } else {
        submitTo
          .replace(this.props.initialValue || this.props.value, valueToSubmit)
          .then(this.onSubmitComplete, this.onSubmitError);
      }
    } else if (submitTo instanceof Query) {
      submitTo
        .produce(valueToSubmit)
        .then(this.onSubmitComplete, this.onSubmitError);
    } else if (submitTo instanceof Request) {
      submitTo
        .produce(valueToSubmit)
        .then(this.onSubmitComplete, this.onSubmitError);
    } else if (submitTo instanceof Mutation) {
      if (insert) {
        submitTo
          .execute(valueToSubmit)
          .then(this.onSubmitComplete, this.onSubmitError);
      } else {
        let prevValue = this.props.initialValue || this.props.value;
        if (prevValue) {
          prevValue = this.props.transformValueOnSubmit(prevValue);
        }
        submitTo
          .execute(valueToSubmit, prevValue)
          .then(this.onSubmitComplete, this.onSubmitError);
      }
    } else {
      // Legacy code-path to support data specification
      if (submitTo.port instanceof Port) {
        if (insert) {
          submitTo.port
            .insert(valueToSubmit)
            .then(this.onSubmitComplete, this.onSubmitError);
        } else {
          submitTo.port
            .replace(this.props.initialValue || this.props.value, valueToSubmit)
            .then(this.onSubmitComplete, this.onSubmitError);
        }
      } else if (submitTo.port instanceof Query) {
        submitTo.port
          .produce(valueToSubmit)
          .then(this.onSubmitComplete, this.onSubmitError);
      }
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
    this.props.onSubmitComplete(data);
  },

  onSubmitError(err) {
    this.setState({submitInProgress: false});
    NotificationCenter.removeNotification(this._progressNotification);
    let errorNotification = React.cloneElement(this.props.errorNotification, {
      children: (
        <div>
          <p>Error submitting data on server:</p>
          <ErrorRenderer error={err} />
        </div>
      )
    });
    NotificationCenter.showNotification(errorNotification);
    this.props.onSubmitError({error: err});
  }
});

let ErrorRendererStyle = {
  stack: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    overflow: 'auto'
  },
  controls: {
    textAlign: 'right'
  }
};

let ErrorRenderer = React.createClass({

  propTypes: {
    error: PropTypes.node,
  },

  render() {
    let {error, ...props} = this.props;
    let {showDetails} = this.state;
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
