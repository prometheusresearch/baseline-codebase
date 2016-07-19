/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactForms from 'react-forms/reactive';
import * as ReactUI from '@prometheusresearch/react-ui';
import {atom} from 'derivable';
import find from 'lodash/find';
import noop from 'lodash/noop';
import concat from 'lodash/concat';
import autobind from 'autobind-decorator';

import {InjectI18N} from 'rex-i18n';

import * as InstrumentSchema from '../instrument/schema';
import {isFieldCompleted, createReactFormsMessages} from '../instrument/validate';
import {makeAssessment} from '../instrument/assessment';
import FormPage from './FormPage';
import FormPaginator from './FormPaginator';
import FormContext from './FormContext';
import * as EventScope from './event/EventScope';

function createFormState({instrument, form, parameters, initialValue = {}, i18n}) {
  let schema = InstrumentSchema.fromInstrument(instrument, {i18n});
  let original = atom(initialValue);
  let event = EventScope.create(form, schema, original, parameters);
  schema.event = event;
  let onChange = (update, keyPath) => {
    let nextValue = ReactForms.update(
      original.get(),
      keyPath,
      update,
      schema
    );
    ReactDOM.unstable_batchedUpdates(() => {
      original.set(nextValue);
    });
  };
  let messages = createReactFormsMessages({i18n});
  let observed = original.derive(event.process);
  let validate = (schema, value) => {
    return ReactForms.Schema.validate(schema, value, {messages});
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
  };
}

@InjectI18N
@ReactForms.reactive
export default class FormEntry extends React.Component {

  static propTypes = {
    /**
     * The RIOS Web Form Configuration to display.
     */
    form: React.PropTypes.object.isRequired,

    /**
     * The RIOS Instrument Definition that corresponds with the form.
     */
    instrument: React.PropTypes.object.isRequired,

    /**
     * The RIOS Assessment Document to initialize the form with.
     */
    assessment: React.PropTypes.object,

    /**
     * The values for the custom/external variables used by the form.
     */
    parameters: React.PropTypes.object,

    /**
     * The display mode of the form. Can be: entry, review, view. Defaults to
     * view.
     */
    mode: React.PropTypes.string,

    /**
     * Disable pagination and render everything in a single page. Defaults to
     * false.
     */
    noPagination: React.PropTypes.bool,

    /**
     * The function to call when the form's value changes. The callback will
     * receive an object that contains:
     * * getAssessment(): The state of the Assessment after the change.
     * * isValid(): Whether or not the current state of the Assessment is valid.
     * * getErrors(): An array of the current validation errors in the form.
     */
    onChange: React.PropTypes.func,

    /**
     * The function to call when the user changes pages within a form. The
     * callback will receive an object that contains:
     * * getAssessment(): The state of the Assessment after the change.
     * * isValid(): Whether or not the current state of the Assessment is valid.
     * * getErrors(): An array of the current validation errors in the form.
     * * pageNumber: The index of the page that the user moved to.
     */
    onPage: React.PropTypes.func,

    /**
     * A collection of API URLs that are used by various widgets or
     * functionality in the form.
     */
    apiUrls: React.PropTypes.object,
  };

  static defaultProps = {
    assessment: {},
    parameters: {},
    mode: 'entry',
    noPagination: false,
    onChange: noop,
    onPage: noop,
    apiUrls: {},
  };

  constructor(props, context) {
    super(props, context);
    let {instrument, form, parameters, assessment} = props;
    this.formState = createFormState({
      instrument,
      form,
      parameters,
      initialValue: assessment ? assessment.values : {},
      i18n: this.getI18N(),
    });

    this.formState.observed.react(this.onChange, {skipFirst: true});
    this.formStateEditable = null;

    this.state = {
      pageNumber: 0,
      editable: null,
    };
  }

  render() {
    let {form, instrument, parameters, mode, noPagination, apiUrls} = this.props;
    let {editable, pageNumber} = this.state;
    let formState = editable ? this.formStateEditable : this.formState;
    let {isDisabled, isPageDisabled, isPageHidden, isHidden} = formState.event;

    let pages = form.pages;
    if (noPagination) {
      pages = [{
        id: '__synthetic_page_id__',
        elements: concat(...pages.map(page => page.elements)),
      }];
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

    let hiddenPageNumberList = pages.map(page => isPageHidden(page.id));
    let page = find(
      pages.slice(pageNumber),
      (page, pageNumber) => !hiddenPageNumberList[pageNumber]
    );
    let hasPages = !noPagination && pages.length > 1;

    let totalFields = instrument.record.length;  // TODO count matrix cells individually?
    let completeFields = 0;
    pages.forEach((page_, idx) => {
      if (idx < pageNumber) {
        // If we've moved past the page, consider all questions complete.
        completeFields += page_.elements.filter((element) => {
          return element.type === 'question';
        }).length;

      } else if (disabledPageNumberList[idx] || hiddenPageNumberList[idx]) {
        // If the page is hidden/disabled, consider all questions complete.
        completeFields += page_.elements.filter((element) => {
          return element.type === 'question';
        }).length;

      } else {
        // Otherwise, consider any hidden/disabled questions or questions with
        // a value complete.
        completeFields += page_.elements.filter(element => {
          if (element.type === 'question') {
            let {fieldId, tags = {}} = element.options;
            return (
              isFieldCompleted(formState.value.select(fieldId))
              || isHidden(fieldId, ...tags)
              || isDisabled(fieldId, ...tags)
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
    for (let p = pageNumber; p < pages.length; p++) {
      let pageHasErrors = pages[p].elements.filter((element) => {
        return element.type === 'question' &&
          formState.value.select(element.options.fieldId).completeErrorList.length > 0
        ;
      }).length > 0;
      if (pageHasErrors) {
        for (let i = p + 1; i < pages.length; i++) {
          disabledPageNumberList[i] = true;
        }
        break;
      }
    }

    return (
      <ReactUI.I18N.I18N dir={this.getI18N().isRightToLeft() ? 'rtl' : 'ltr'}>
        <FormContext
          self={this}
          form={form}
          parameters={parameters}
          event={formState.event}
          apiUrls={apiUrls}>
          <div>
            {mode === 'entry' &&
              <FormProgressBar
                completeFields={completeFields}
                totalFields={totalFields}
                />}
            {hasPages &&
              <FormPaginator
                currentPageNumber={pageNumber}
                pageCount={pages.length}
                hiddenPageNumberList={hiddenPageNumberList}
                disabledPageNumberList={disabledPageNumberList}
                onPage={this.onPage}
                marginBottom="medium"
                />}
            <FormPage
              mode={mode}
              editable={editable}
              onEditable={this.onEditable}
              page={page}
              formValue={formState.value}
              />
            {hasPages &&
              <FormPaginator
                currentPageNumber={pageNumber}
                pageCount={pages.length}
                hiddenPageNumberList={hiddenPageNumberList}
                disabledPageNumberList={disabledPageNumberList}
                onPage={this.onPage}
                marginV="medium"
                />}
          </div>
        </FormContext>
      </ReactUI.I18N.I18N>
    );
  }

  componentWillReceiveProps({assessment, form, instrument, parameters}) {
    if (form !== this.props.form) {
      console.warning( // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "form" prop'
      );
    }
    if (instrument !== this.props.instrument) {
      console.warning( // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "instrument" prop'
      );
    }
    if (assessment !== this.props.assessment) {
      console.warning( // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "assessment" prop'
      );
    }
    if (parameters !== this.props.parameters) {
      console.warning( // eslint-disable-line no-console
        '<FormEntry /> does not handle updating "parameters" prop'
      );
    }
  }

  getAssessment() {
    return makeAssessment(
      this.formState.value.value,
      this.props.instrument,
      {},
      {language: this.getI18N().config.locale}
    );
  }

  getErrors() {
    return this.formState.value.completeErrorList.map((error) => {
      return {
        field: error.field.substring(5),
        message: error.message
      };
    });
  }

  isValid() {
    return this.formState.value.completeErrorList.length === 0;
  }

  snapshotState(formValue) {
    formValue = formValue || this.formState.value;
    let {instrument} = this.props;
    let {locale} = this.getI18N().config;

    return {
      getAssessment: () => {
        return makeAssessment(
          formValue.value,
          instrument,
          {},
          {language: locale}
        );
      },

      isValid: () => {
        return formValue.completeErrorList.length === 0;
      },

      getErrors() {
        return formValue.completeErrorList.map((error) => {
          return {
            field: error.field.substring(5),
            message: error.message
          };
        });
      }
    };
  }

  onChange = () => {
    this.props.onChange(this.snapshotState(this.formState.value));
  };

  onPage = ({pageNumber}) => {
    this.setState(
      {pageNumber},
    () => {
      this.props.onPage({
        ...this.snapshotState(),
        pageNumber
      });
    });
  };

  onEditable = ({editable, commit}) => {
    if (editable === null) {
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
    this.setState({editable});
  };
}


@InjectI18N
class FormProgressBar extends React.Component {
  render() {
    let {totalFields, completeFields} = this.props;
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

  @autobind
  formatLabel(state) {
    return this.getI18N().formatPercent(state.progress);
  }
}

