/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import * as ReactDOM from "react-dom";
import type { value as formValue } from "react-forms";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import { atom } from "derivable";
import find from "lodash/find";
import noop from "lodash/noop";
import concat from "lodash/concat";

import { InjectI18N } from "rex-i18n";
import * as types from "../types.js";

import * as InstrumentSchema from "../instrument/schema";
import {
  isFieldCompleted,
  createReactFormsMessages,
} from "../instrument/validate";
import { makeAssessment, makeInitialValue } from "../instrument/assessment";
import FormPage from "./FormPage";
import FormPaginator from "./FormPaginator";
import FormContext from "./FormContext";
import * as EventExecutor from "./event/EventExecutor";
import * as FormFormatConfig from "./FormFormatConfig";

type FormState = {|
  original: any,
  observed: any,
  value: formValue,
  event: any,
  formatConfig: FormFormatConfig.Config,
|};

function createFormState({
  instrument,
  form,
  parameters,
  initialValue = {},
  i18n,
}): FormState {
  const formatConfig = FormFormatConfig.make(form, i18n.config.locale);

  let schema = InstrumentSchema.fromInstrument(instrument, {
    i18n,
    formatConfig,
  });
  let processedInitialValue = makeInitialValue(
    instrument,
    (initialValue: any),
    formatConfig,
  );
  let original = atom(processedInitialValue);
  let event = EventExecutor.create(form, (schema: any), original, parameters);
  schema.event = event;
  let onChange = (update, keyPath) => {
    let nextValue = ReactForms.update(original.get(), keyPath, update, schema);
    ReactDOM.unstable_batchedUpdates(() => {
      original.set(nextValue);
    });
  };
  let messages = createReactFormsMessages({ i18n });
  let observed = original.derive(event.process);
  let validate = (schema, value) => {
    return ReactForms.Schema.validate(schema, value, { messages });
  };
  let value = ReactForms.createValue({
    value: observed,
    schema,
    onChange,
    validate,
  });
  return {
    original,
    observed,
    value,
    event,
    formatConfig,
  };
}

type FormProgressBarProps = {|
  totalFields: number,
  completeFields: number,
|};

const FormProgressBar = InjectI18N(
  class extends React.Component<FormProgressBarProps> {
    getI18N: () => any;
    render() {
      let { totalFields, completeFields } = this.props;
      let progress = completeFields / totalFields;

      return (
        <ReactUI.Block marginBottom="medium">
          <ReactUI.ProgressBar
            progress={progress}
            formatLabel={this.formatLabel}
          />
        </ReactUI.Block>
      );
    }

    formatLabel = state => {
      return this.getI18N().formatPercent(state.progress);
    };
  },
);

type FormChange = {|
  getAssessment: () => types.RIOSAssessment,
  isValid: () => boolean,
  getErrors: () => { message: string, field: string }[],
|};

type FormEntryProps = {|
  form: types.RIOSForm,

  instrument: types.RIOSInstrument,

  assessment?: types.RIOSAssessment,

  parameters?: Object,

  mode?: "entry" | "review" | "view",

  noPagination?: boolean,

  /**
   * The function to call when the form's value changes. The callback will
   * receive an object that contains:
   * * getAssessment(): The state of the Assessment after the change.
   * * isValid(): Whether or not the current state of the Assessment is valid.
   * * getErrors(): An array of the current validation errors in the form.
   */
  onChange?: FormChange => void,

  /**
   * The function to call when the user changes pages within a form. The
   * callback will receive an object that contains:
   * * getAssessment(): The state of the Assessment after the change.
   * * isValid(): Whether or not the current state of the Assessment is valid.
   * * getErrors(): An array of the current validation errors in the form.
   * * pageNumber: The index of the page that the user moved to.
   */
  onPage?: Function,

  /**
   * A collection of API URLs that are used by various widgets or
   * functionality in the form.
   */
  apiUrls?: Object,

  /**
   * Widget configuration.
   *
   * {
   *   edit: { [widgetType: string]: React.Component },
   *   view: { [widgetType: string]: React.Component },
   *   reconcile: { [widgetType: string]: React.Component },
   * }
   */
  widgetConfig?: Object,
|};

type FormEntryState = {|
  pageNumber: number,
  editable: any,
|};

class FormEntry extends React.Component<FormEntryProps, FormEntryState> {
  static defaultProps = {
    assessment: {},
    parameters: {},
    mode: "entry",
    noPagination: false,
    onChange: noop,
    onPage: noop,
    apiUrls: {},
  };

  _: (...any) => any;
  getI18N: () => any;
  formState: FormState;
  formStateEditable: ?FormState;

  constructor(props, context) {
    super(props, context);
    let { instrument, form, parameters, assessment } = props;
    this.formState = createFormState({
      instrument,
      form,
      parameters: parameters || {},
      initialValue: ((assessment ? assessment.values : {}): any),
      i18n: this.getI18N(),
    });

    this.formState.observed.react(this.onChange, { skipFirst: true });
    this.formStateEditable = null;

    this.state = {
      pageNumber: this.getHiddenPageNumberList().indexOf(false),
      editable: null,
    };
  }

  getHiddenPageNumberList = () => {
    return this.props.form.pages.map(page =>
      this.formState.event.isPageHidden(page.id),
    );
  };

  render() {
    let {
      form,
      instrument,
      parameters,
      mode,
      noPagination,
      apiUrls,
      widgetConfig,
    } = this.props;
    let { editable, pageNumber } = this.state;
    let formState =
      editable && this.formStateEditable != null
        ? this.formStateEditable
        : this.formState;
    let {
      isDisabled,
      isPageDisabled,
      isPageHidden,
      isHidden,
    } = formState.event;

    let pages: any = form.pages;
    if (noPagination) {
      pages = [
        {
          id: "__synthetic_page_id__",
          elements: concat(
            ...pages.map(page => {
              return page.elements.map(element => {
                return {
                  originalPageId: page.id,
                  ...element,
                };
              });
            }),
          ),
        },
      ];
      pageNumber = 0;
    }

    // Determine which pages are disabled, if we are in review mode and some
    // question is in editable mode then we disabled all page navigation.
    let disabledPageNumberList;
    if (editable != null) {
      disabledPageNumberList = pages.map(_page => true);
    } else {
      disabledPageNumberList = pages.map(page => isPageDisabled(page.id));
    }

    let hiddenPageNumberList = this.getHiddenPageNumberList();
    let page = pages[pageNumber];
    let hasPages = !noPagination && pages.length > 1;

    let totalFields = instrument.record.length; // TODO count matrix cells individually?
    let completeFields = 0;
    pages.forEach((page_, idx) => {
      if (idx < pageNumber) {
        // If we've moved past the page, consider all questions complete.
        completeFields += page_.elements.filter(element => {
          return element.type === "question";
        }).length;
      } else if (disabledPageNumberList[idx] || hiddenPageNumberList[idx]) {
        // If the page is hidden/disabled, consider all questions complete.
        completeFields += page_.elements.filter(element => {
          return element.type === "question";
        }).length;
      } else {
        // Otherwise, consider any hidden/disabled questions or questions with
        // a value complete.
        completeFields += page_.elements.filter((element: any) => {
          if (element.type === "question") {
            let { fieldId, tags = [] } = element.options;
            return (
              isFieldCompleted(formState.value.select(fieldId)) ||
              isHidden(fieldId, ...tags) || // TODO: check what this expects
              isDisabled(fieldId, ...tags) // {} doesn't make any sense here
            );
          } else {
            return false;
          }
        }).length;
      }
    });

    // If there are errors/required on a page, then mark all future pages as
    // disabled so they user can't go forward until they resolve this page.
    //
    // FYI: We modify the disabledPageNumberList /after/ we calculate form
    // completeness because we don't want to count the blocked pages as
    // complete.
    let pageHasErrors = false;
    let pageHasUnfinishedRequired = false;
    for (let p = pageNumber; p < pages.length; p++) {
      let hasErrors = false;
      pages[p].elements.forEach((element: any) => {
        if (element.type === "question") {
          let fieldValue: any = formState.value.select(element.options.fieldId);
          if (fieldValue.completeErrorList.length > 0) {
            hasErrors = true;
            if (p === pageNumber) {
              pageHasErrors = true;
            }
          }
          if (
            p === pageNumber &&
            fieldValue.schema.required &&
            fieldValue.schema.required.length > 0 &&
            !isFieldCompleted(fieldValue)
          ) {
            pageHasUnfinishedRequired = true;
          }
        }
      });

      if (hasErrors) {
        for (let i = p + 1; i < pages.length; i++) {
          disabledPageNumberList[i] = true;
        }
        break;
      }
    }

    let warning;
    if (pageHasUnfinishedRequired) {
      warning = this._(
        "Please complete all required fields before proceeding.",
      );
    } else if (pageHasErrors) {
      warning = this._("Please resolve the errors above before proceeding.");
    }

    return (
      <ReactUI.I18N.I18N dir={this.getI18N().isRightToLeft() ? "rtl" : "ltr"}>
        <FormContext
          widgetConfig={widgetConfig}
          self={this}
          form={form}
          parameters={parameters || {}}
          event={formState.event}
          apiUrls={apiUrls || {}}
        >
          <div>
            {mode === "entry" && (
              <FormProgressBar
                completeFields={completeFields}
                totalFields={totalFields}
              />
            )}
            {hasPages && (
              <FormPaginator
                currentPageNumber={pageNumber}
                pageCount={pages.length}
                hiddenPageNumberList={hiddenPageNumberList}
                disabledPageNumberList={disabledPageNumberList}
                onPage={this.onPage}
                marginBottom="medium"
              />
            )}
            <FormPage
              mode={mode}
              editable={editable}
              onEditable={this.onEditable}
              page={page}
              formValue={formState.value}
            />
            {warning && (
              <div
                style={{
                  textAlign: "center",
                }}
              >
                <ReactUI.ErrorText>{warning}</ReactUI.ErrorText>
              </div>
            )}
            {hasPages && (
              <FormPaginator
                currentPageNumber={pageNumber}
                pageCount={pages.length}
                hiddenPageNumberList={hiddenPageNumberList}
                disabledPageNumberList={disabledPageNumberList}
                onPage={this.onPage}
                marginV="medium"
              />
            )}
          </div>
        </FormContext>
      </ReactUI.I18N.I18N>
    );
  }

  componentWillReceiveProps({ assessment, form, instrument, parameters }) {
    if (form !== this.props.form) {
      console.warn(
        // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "form" prop',
      );
    }
    if (instrument !== this.props.instrument) {
      console.warn(
        // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "instrument" prop',
      );
    }
    if (assessment !== this.props.assessment) {
      console.warn(
        // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "assessment" prop',
      );
    }
    if (parameters !== this.props.parameters) {
      console.warn(
        // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "parameters" prop',
      );
    }
  }

  getAssessment() {
    return makeAssessment(
      this.formState.value.value,
      this.props.instrument,
      {},
      {
        language: this.getI18N().config.locale,
        formatConfig: this.formState.formatConfig,
      },
    );
  }

  getErrors() {
    return this.formState.value.completeErrorList.map(error => {
      return {
        field: error.field.substring(5),
        message: error.message,
      };
    });
  }

  isValid() {
    return this.formState.value.completeErrorList.length === 0;
  }

  snapshotState(formValue: ?formValue) {
    formValue = formValue || this.formState.value;
    let { instrument } = this.props;
    let { locale } = this.getI18N().config;
    let { formatConfig } = this.formState;

    return {
      getAssessment: () => {
        invariant(formValue != null, "formValue is not available");
        return makeAssessment(
          formValue.value,
          instrument,
          {},
          {
            language: locale,
            formatConfig,
          },
        );
      },

      isValid: () => {
        invariant(formValue != null, "formValue is not available");
        return formValue.completeErrorList.length === 0;
      },

      getErrors() {
        invariant(formValue != null, "formValue is not available");
        return formValue.completeErrorList.map(error => {
          return {
            field: error.field.substring(5),
            message: error.message,
          };
        });
      },
    };
  }

  onChange = () => {
    let { onChange } = this.props;
    if (onChange != null) {
      onChange(this.snapshotState(this.formState.value));
    }
  };

  onPage = ({ pageNumber }) => {
    this.setState({ pageNumber }, () => {
      let { onPage } = this.props;
      if (onPage != null) {
        onPage({
          ...this.snapshotState(),
          pageNumber,
        });
      }
    });
  };

  onEditable = ({ editable, commit }) => {
    if (editable === null && this.formStateEditable != null) {
      if (commit) {
        this.formState.original.set(this.formStateEditable.value.value);
      }
      this.formStateEditable = null;
    } else {
      this.formStateEditable = createFormState({
        form: this.props.form,
        instrument: this.props.instrument,
        parameters: this.props.parameters,
        initialValue: this.formState.value.value,
        i18n: this.getI18N(),
      });
    }
    this.setState({ editable });
  };
}

export default (InjectI18N(
  ReactForms.reactive(FormEntry),
): React.AbstractComponent<FormEntryProps>);
