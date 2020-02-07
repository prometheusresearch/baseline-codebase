/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { createValue, type schema, type value, type error } from "react-forms";
import debounce from "lodash/debounce";
import * as rexui from "rex-ui";
import {
  ConfirmNavigation,
  type Instance as ConfirmNavigationInstance
} from "rex-ui/ConfirmNavigation";

import { emptyFunction } from "../lang";
import { VBox } from "react-stylesheet";
import * as ui from "../ui";
import * as data from "../data";
import * as Layout from "./Layout";

import { Fieldset } from "./Fieldset";

export const ERROR_SENTINEL = "__rex_widget_validate_form__";

export type AsyncValidate = (
  value: mixed,
  errorList: error[]
) => Promise<AsyncValidateResult>;

export type AsyncValidateResult = {
  [key: string]: error
};

export type Props = {|
  /**
   * If form should operate in "insert" mode (for creating new entities).
   */
  insert?: boolean,

  /**
   * Initial form value
   */
  initialValue?: mixed,

  /**
   * Callback which is called on every change to form which results in a valid
   * value.
   */
  onChange: (nextValue: mixed, prevValue: mixed, formValue: value) => mixed,

  /**
   * The data specification to submit the form value to.
   */
  submitTo?: data.Fetcher<any>,

  /**
   * The form schema in json schema format.
   */
  schema?: ?schema,

  /**
   * Initial form value.
   */
  value?: value,

  /**
   * Submit button element.
   */
  submitButton?: React.Node,
  /**
   * Submit button title.
   */
  submitButtonTitle?: React.Node,

  /**
   * func
   *
   * Callback which fires on form submit.
   */
  onBeforeSubmit: Function,

  /**
   * func
   *
   * Callback which can be used to transform value before submitting it on
   * server. Value won't be revalidated.
   */
  transformValueOnSubmit: mixed => mixed,

  /**
   * func
   *
   * Callback which fires after form submit is complete.
   */
  onSubmitComplete: Function,
  /**
   * func
   *
   * Callback which fires if form submit results in an error.
   */
  onSubmitError: Function,

  /**
   * @private
   */
  context?: Object,

  /**
   * Error notification
   */
  errorNotification: React.Node,

  /**
   * Progress notification
   */
  progressNotification: React.Node,

  /**
   * Complete notification
   */
  completeNotification: React.Node,

  /**
   * Form children
   */
  children: React.Node,

  /**
   * Callback is called on each update.
   */
  onUpdate: Function,

  /**
   * Async validate result.
   */
  validate?: ?AsyncValidate,

  /**
   * Set form layout.
   *
   * If not set then layout will be inferred by measuring form DOM element.
   */
  layout?: Layout.layout,

  /**
   * Show confirm dialog if user is trying to navigate away from the page while
   * form value is modified.
   */
  confirmNavigationIfDirty?: boolean
|};

type State = {
  submitInProgress: boolean,
  value: value,
  isDirty: boolean
};

/**
 * Form component.
 *
 * @public
 */
export class Form extends React.Component<Props, State> {
  static defaultProps = {
    submitButton: (
      <rexui.SuccessButton variant="contained">Submit</rexui.SuccessButton>
    ),
    onChange: emptyFunction.thatReturnsArgument,
    onUpdate: emptyFunction.thatReturnsArgument,
    onBeforeSubmit: emptyFunction.thatReturnsArgument,
    onSubmitComplete: emptyFunction,
    onSubmitError: emptyFunction,
    transformValueOnSubmit: emptyFunction.thatReturnsArgument,
    progressNotification: (
      <ui.Notification kind="info" icon="cog">
        Data saving is in progress
      </ui.Notification>
    ),
    completeNotification: (
      <ui.Notification kind="success" icon="ok">
        Data saved successfully
      </ui.Notification>
    ),
    errorNotification: (
      <ui.Notification kind="danger" icon="remove">
        There was an error while submitting data to server
      </ui.Notification>
    )
  };

  render() {
    let {
      children,
      schema,
      submitButton,
      submitButtonTitle,
      validate: _validate,
      onSubmitComplete: _onSubmitComplete,
      initialValue: _initialValue,
      transformValueOnSubmit: _transformValueOnSubmit,
      onUpdate: _onUpdate,
      onBeforeSubmit: _onBeforeSubmit,
      onSubmitError: _onSubmitError,
      progressNotification: _progressNotification,
      completeNotification: _completeNotification,
      errorNotification: _errorNotification,
      submitTo: _submitTo,
      context: _context,
      layout,
      confirmNavigationIfDirty,
      ...props
    } = this.props;
    let { value, submitInProgress, isDirty } = this.state;
    if (submitButton != null) {
      let submitButtonProps = {
        type: "button",
        onClick: this.onSubmit,
        disabled:
          (value.params.forceShowErrors &&
            value.completeErrorList.length > 0) ||
          submitInProgress
      };
      if (submitButtonTitle) {
        submitButtonProps = {
          ...submitButtonProps,
          children: submitButtonTitle
        };
      }
      // $FlowFixMe: guarded above
      submitButton = React.cloneElement(submitButton, submitButtonProps);
    }
    return (
      <Layout.FormLayout layout={layout}>
        {isDirty && confirmNavigationIfDirty && (
          <ConfirmNavigation ref={this._onConfirmNavigation} />
        )}
        <Fieldset {...props} formValue={value} onChange={undefined}>
          {children}
        </Fieldset>
        {submitButton && (
          <VBox style={{ marginTop: 10 }}>
            <div>{submitButton}</div>
          </VBox>
        )}
      </Layout.FormLayout>
    );
  }

  _confirmNavigation: ?ConfirmNavigationInstance;
  _onConfirmNavigation = (instance: ?ConfirmNavigationInstance) => {
    this._confirmNavigation = instance;
  };

  _progressNotification: ?ui.NotificationID;
  _promiseLastValidation: Promise<void>;

  constructor(props: Props) {
    super(props);
    this.state = {
      submitInProgress: false,
      value: createValue({
        schema: this.props.schema,
        value: this.props.value,
        onChange: this.onChange,
        params: { context: this.props.context }
      }),
      isDirty: false
    };
    this._progressNotification = null;
    this._promiseLastValidation = Promise.resolve();
  }

  componentDidUpdate() {
    let value = this.props.onUpdate(this.state.value.value);
    if (value !== this.state.value.value) {
      this.setState({
        // eslint-disable-line react/no-did-update-set-state
        value: this.state.value.update(value, true)
      });
    }
  }

  componentWillReceiveProps(nextProps: Props) {
    let value = this.state.value;
    if (nextProps.schema !== this.props.schema) {
      value = value.setSchema(nextProps.schema);
      this.setState({ value });
    }
    if (nextProps.context !== this.props.context) {
      value = value.createRoot({
        params: { ...value.params, context: nextProps.context }
      });
      this.setState({ value });
    }
  }

  submit = () => {
    this._validate().then(this._submitImpl);
  };

  _submitImpl = () => {
    let { value } = this.state;
    let {
      submitTo,
      insert,
      onBeforeSubmit,
      transformValueOnSubmit
    } = this.props;

    if (value.completeErrorList.length > 0) {
      this.setState({
        // Note that we use value from state, not the modified one.
        value: value.createRoot({
          params: { forceShowErrors: true }
        })
      });

      return;
    }

    onBeforeSubmit(value.value, value);

    this._progressNotification = ui.showNotification(
      this.props.progressNotification,
      Infinity
    );

    this.setState({ submitInProgress: true });

    let dataValue = transformValueOnSubmit(value.value);
    if (submitTo instanceof data.Port) {
      if (insert) {
        submitTo
          .insert(dataValue)
          .then(this.onSubmitComplete, this.onSubmitError);
      } else {
        submitTo
          .replace(this.props.initialValue || this.props.value, dataValue)
          .then(this.onSubmitComplete, this.onSubmitError);
      }
    } else if (submitTo instanceof data.Query) {
      submitTo
        .execute(dataValue)
        .then(this.onSubmitComplete, this.onSubmitError);
    } else if (submitTo instanceof data.Request) {
      submitTo
        .produce(dataValue)
        .then(this.onSubmitComplete, this.onSubmitError);
    } else if (submitTo instanceof data.Mutation) {
      if (insert) {
        submitTo
          .execute(dataValue)
          .then(this.onSubmitComplete, this.onSubmitError);
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

  onChange = (value: value) => {
    let nextValue = value.update(
      this.props.onChange(value.value, this.state.value.value, value),
      true
    );
    this._validateDebounced(nextValue);
    this.setState({ value: nextValue, isDirty: true });
  };

  _validate = (formValue: value = this.state.value) => {
    if (this.props.validate != null) {
      this._promiseLastValidation = this.props
        .validate(formValue.value, formValue.completeErrorList)
        .then(
          this._onValidateComplete.bind(null, formValue),
          this._onValidateError
        );
    }
    return this._promiseLastValidation;
  };

  _validateDebounced = debounce(this._validate, 700);

  _onValidateComplete = (formValue: value, result: AsyncValidateResult) => {
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
    return new Promise<void>(resolve => {
      this.setState(state => {
        let value = state.value;
        const prevErrors = value.completeErrorList.filter(
          // $FlowFixMe: ...
          error => error[ERROR_SENTINEL]
        );
        for (let error of prevErrors) {
          value = value.removeError(error, true);
        }
        for (let error of nextErrors) {
          value = value.select(error.field).addError(
            // $FlowFixMe: ...
            {
              message: error.message,
              [ERROR_SENTINEL]: true
            },
            true
          ).root;
        }
        return { ...state, value };
      }, resolve);
    });
  };

  _onValidateError = (err: Error) => {
    console.error("Form validation error:", err); // eslint-disable-line no-console
  };

  onSubmit = (e: UIEvent) => {
    e.stopPropagation();
    e.preventDefault();
    this.submit();
  };

  onSubmitComplete = (data: mixed) => {
    this.setState({ submitInProgress: false });
    if (this._progressNotification != null) {
      ui.removeNotification(this._progressNotification);
    }
    ui.showNotification(this.props.completeNotification);
    if (this._confirmNavigation != null) {
      this._confirmNavigation.allow();
    }
    this.props.onSubmitComplete(data);
  };

  onSubmitError = (err: Error) => {
    this.setState({ submitInProgress: false });
    if (this._progressNotification != null) {
      ui.removeNotification(this._progressNotification);
    }
    // $FlowFixMe: ...
    let errorNotification = React.cloneElement(this.props.errorNotification, {
      children: (
        <div>
          <p>Error submitting data on server:</p>
          <ErrorRenderer error={err} />
        </div>
      )
    });
    ui.showNotification(errorNotification, Infinity);
    this.props.onSubmitError({ error: err });
  };
}

let ErrorRenderer = ({ error }) => {
  let [showDetails, setShowDetails] = React.useState(false);

  let onClick = e => {
    e.stopPropagation();
    setShowDetails(true);
  };

  return (
    <div onChange={undefined}>
      <div>{error.message ? error.message : error.toString()}</div>
      {error.stack && !showDetails && (
        <div
          style={{
            textAlign: "right"
          }}
        >
          <rexui.DangerButton size="small" onClick={onClick}>
            Show details
          </rexui.DangerButton>
        </div>
      )}
      {error.stack && showDetails && (
        <div
          style={{
            whiteSpace: "pre",
            fontFamily: "monospace",
            overflow: "auto"
          }}
        >
          {error.stack}
        </div>
      )}
    </div>
  );
};
