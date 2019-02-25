/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';
import {createValue} from 'react-forms';
import debounce from 'lodash/function/debounce';

import {emptyFunction} from '../../lang';
import {
  SuccessButton,
  DangerButton,
  showNotification,
  removeNotification,
  Notification,
} from '../../ui';
import {VBox} from '../../layout';
import {Port} from '../data/Port';
import {Query} from '../data/Query';
import {Mutation} from '../data/Mutation';
import {Request} from '../data/Request';

import Fieldset from './Fieldset';

export const ERROR_SENTINEL = '__rex_widget_validate_form__';

let FormStyle = {
  controls: {
    marginTop: 10,
  },
};

/**
 * Form component.
 *
 * @public
 */
export default class Form extends React.Component {
  static propTypes = {
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
     */
    onBeforeSubmit: PropTypes.func,

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
  };

  static defaultProps = {
    submitButton: <SuccessButton>Submit</SuccessButton>,
    onChange: emptyFunction.thatReturnsArgument,
    onUpdate: emptyFunction.thatReturnsArgument,
    onBeforeSubmit: emptyFunction.thatReturnsArgument,
    onSubmitComplete: emptyFunction,
    onSubmitError: emptyFunction,
    transformValueOnSubmit: emptyFunction.thatReturnsArgument,
    progressNotification: (
      <Notification
        kind="info"
        text="Data saving is in progress"
        icon="cog"
        ttl={Infinity}
      />
    ),
    completeNotification: (
      <Notification kind="success" text="Data saved successfully" icon="ok" />
    ),
    errorNotification: (
      <Notification
        kind="danger"
        text="There was an error while submitting data to server"
        icon="remove"
        ttl={Infinity}
      />
    ),
  };

  render() {
    let {children, schema, submitButton, submitButtonTitle, ...props} = this.props;
    let {value, submitInProgress} = this.state;
    if (submitButton) {
      let submitButtonProps = {
        type: 'button',
        onClick: this.onSubmit,
        disabled:
          (value.params.forceShowErrors && value.completeErrorList.length > 0) ||
          submitInProgress,
      };
      if (submitButtonTitle) {
        submitButtonProps.children = submitButtonTitle;
      }
      submitButton = React.cloneElement(submitButton, submitButtonProps);
    }
    return (
      <VBox>
        <Fieldset {...props} formValue={value} onChange={undefined}>
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
  }

  constructor(props) {
    super(props);
    this.state = {
      submitInProgress: false,
      value: createValue({
        schema: this.props.schema,
        value: this.props.value,
        onChange: this.onChange,
        params: {context: this.props.context},
      }),
    };
    this._promiseLastValidation = Promise.resolve();
  }

  componentDidUpdate() {
    let value = this.props.onUpdate(this.state.value.value);
    if (value !== this.state.value.value) {
      this.setState({
        // eslint-disable-line react/no-did-update-set-state
        value: this.state.value.update(value, true),
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    let value = this.state.value;
    if (nextProps.schema !== this.props.schema) {
      value = value.setSchema(nextProps.schema);
      this.setState({value});
    }
    if (nextProps.context !== this.props.context) {
      value = value.createRoot({
        params: {...value.params, context: nextProps.context},
      });
      this.setState({value});
    }
  }

  submit = () => {
    this._validate().then(this._submitImpl);
  };

  _submitImpl = () => {
    let {value} = this.state;
    let {submitTo, insert, onBeforeSubmit, transformValueOnSubmit} = this.props;

    if (value.completeErrorList.length > 0) {
      this.setState({
        // Note that we use value from state, not the modified one.
        value: value.createRoot({
          params: {forceShowErrors: true},
        }),
      });

      return;
    }

    onBeforeSubmit(value.value, value);

    this._progressNotification = showNotification(this.props.progressNotification);

    this.setState({submitInProgress: true});

    let dataValue = transformValueOnSubmit(value.value);
    if (submitTo instanceof Port) {
      if (insert) {
        submitTo.insert(dataValue).then(this.onSubmitComplete, this.onSubmitError);
      } else {
        submitTo
          .replace(this.props.initialValue || this.props.value, dataValue)
          .then(this.onSubmitComplete, this.onSubmitError);
      }
    } else if (submitTo instanceof Query) {
      submitTo.execute(dataValue).then(this.onSubmitComplete, this.onSubmitError);
    } else if (submitTo instanceof Request) {
      submitTo.produce(dataValue).then(this.onSubmitComplete, this.onSubmitError);
    } else if (submitTo instanceof Mutation) {
      if (insert) {
        submitTo.execute(dataValue).then(this.onSubmitComplete, this.onSubmitError);
      } else {
        let prevValue = this.props.initialValue || this.props.value;
        if (prevValue) {
          prevValue = this.props.transformValueOnSubmit(prevValue);
        }
        submitTo
          .execute(dataValue, prevValue)
          .then(this.onSubmitComplete, this.onSubmitError);
      }
    }
  };

  onChange = value => {
    value = value.update(
      this.props.onChange(value.value, this.state.value.value, value),
      true,
    );
    this._validateDebounced(value);
    this.setState({value});
  };

  _validate = (formValue = this.state.value) => {
    if (this.props.validate != null) {
      this._promiseLastValidation = this.props
        .validate(formValue.value, formValue.completeErrorList)
        .then(this._onValidateComplete.bind(null, formValue), this._onValidateError);
    }
    return this._promiseLastValidation;
  };

  _validateDebounced = debounce(this._validate, 700);

  _onValidateComplete = (formValue, result) => {
    // check if we are past the value we used to start validation
    if (formValue !== this.state.value) {
      return;
    }
    if (result == null) {
      return;
    }
    const nextErrors = [];
    const keys = Object.keys(result);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const error = result[key];
      if (error == null) {
        continue;
      }
      if (error.message == null) {
        continue;
      }
      nextErrors.push(error);
    }
    return new Promise(resolve => {
      this.setState(state => {
        let value = state.value;
        const prevErrors = value.completeErrorList.filter(error => error[ERROR_SENTINEL]);
        for (let error of prevErrors) {
          value = value.removeError(error, true);
        }
        for (let error of nextErrors) {
          value = value.select(error.field).addError(
            {
              message: error.message,
              [ERROR_SENTINEL]: true,
            },
            true,
          ).root;
        }
        value = value.updateParams({forceShowErrors: true}, true);
        return {...state, value};
      }, resolve);
    });
  };

  _onValidateError = err => {
    console.error('Form validation error:', err); // eslint-disable-line no-console
  };

  onSubmit = e => {
    e.stopPropagation();
    e.preventDefault();
    this.submit();
  };

  onSubmitComplete = data => {
    this.setState({submitInProgress: false});
    removeNotification(this._progressNotification);
    showNotification(this.props.completeNotification);
    this.props.onSubmitComplete(data);
  };

  onSubmitError = err => {
    this.setState({submitInProgress: false});
    removeNotification(this._progressNotification);
    let errorNotification = React.cloneElement(this.props.errorNotification, {
      children: (
        <div>
          <p>Error submitting data on server:</p>
          <ErrorRenderer error={err} />
        </div>
      ),
    });
    showNotification(errorNotification);
    this.props.onSubmitError({error: err});
  };
}

let ErrorRendererStyle = {
  stack: {
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    overflow: 'auto',
  },
  controls: {
    textAlign: 'right',
  },
};

let ErrorRenderer = React.createClass({
  propTypes: {
    error: PropTypes.node,
  },

  render() {
    let {error, ...props} = this.props;
    let {showDetails} = this.state;
    return (
      <div {...props} onChange={undefined}>
        <div>
          {error.message ? error.message : error.toString()}
        </div>
        {error.stack &&
          !showDetails &&
          <div style={ErrorRendererStyle.controls}>
            <DangerButton size="small" onClick={this.onClick}>
              Show details
            </DangerButton>
          </div>}
        {error.stack &&
          showDetails &&
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
      showDetails: false,
    };
  },
});
