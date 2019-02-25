/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as ReactForms from "react-forms/reactive";
import PlusIcon from "react-icons/lib/fa/plus";
import CloseIcon from "react-icons/lib/fa/close";
import some from "lodash/some";

import { InjectI18N } from "rex-i18n";

import focusFirstWithin from "../../focusFirstWithin";
import * as FormContext from "../FormContext";
import ErrorList from "../ErrorList";
import Question from "../Question";
import LocalizedString from "../LocalizedString";

const RecordListItem = ReactForms.reactive(
  class extends React.Component {
    static contextTypes = FormContext.contextTypes;
    static childContextTypes = FormContext.contextTypes;

    constructor(props, context) {
      super(props, context);
      this._root = null;
      this.event = context.event.select(props.formValue.keyPath);
    }

    getChildContext() {
      return {
        ...this.context,
        event: this.event
      };
    }

    render() {
      let {
        formValue,
        readOnly,
        questions,
        onRemove,
        removeLabel
      } = this.props;
      let hasError = formValue.completeErrorList.length > 0;
      return (
        <ReactUI.Card marginBottom="small">
          <div ref={this.onRoot}>
            {questions.map(question => {
              let questionFormValue = formValue.select(question.fieldId);
              let { eventKey } = questionFormValue.schema.form;
              let hidden = this.event.isHidden(eventKey);
              if (hidden) {
                return null;
              }
              let disabled = this.event.isDisabled(eventKey);
              return (
                <Question
                  plain
                  key={question.fieldId}
                  disabled={disabled}
                  question={question}
                  formValue={questionFormValue}
                  mode={readOnly ? "view" : undefined}
                />
              );
            })}
          </div>
          {!readOnly &&
            hasError && (
              <ReactUI.Block marginStart={20} marginBottom={10}>
                <ErrorList formValue={formValue} />
              </ReactUI.Block>
            )}
          {!readOnly && (
            <ReactUI.Block position="absolute" top={10} positionEnd={10}>
              <ReactUI.FlatDangerButton
                icon={<CloseIcon />}
                tabIndex={-1}
                size="small"
                onClick={onRemove}
              >
                <LocalizedString text={removeLabel} />
              </ReactUI.FlatDangerButton>
            </ReactUI.Block>
          )}
        </ReactUI.Card>
      );
    }

    componentDidMount() {
      focusFirstWithin(this._root);
    }

    onRoot = _root => {
      this._root = _root;
    };
  }
);

export default InjectI18N(
  ReactForms.reactive(
    class RecordList extends React.Component {
      render() {
        let {
          formValue,
          question,
          readOnly,
          options: { addLabel = this._("Add"), removeLabel = this._("Remove") }
        } = this.props;
        let value = formValue.value || [];
        let hasError = formValue.completeErrorList.length > 0;
        let showErrorList =
          formValue.params.forceShowErrorList ||
          some(formValue.completeErrorList, error => error.force);

        return (
          <ReactUI.Block paddingTop="small">
            <div>
              {value.map((_item, idx) => (
                <RecordListItem
                  key={idx}
                  readOnly={readOnly}
                  removeLabel={removeLabel}
                  formValue={formValue.select(idx)}
                  questions={question.questions}
                  onRemove={this.onRemove.bind(null, idx)}
                />
              ))}
            </div>
            {!readOnly &&
              hasError &&
              showErrorList && <ErrorList formValue={formValue} />}
            {!readOnly && (
              <ReactUI.Block marginTop="small">
                <ReactUI.Button
                  icon={<PlusIcon />}
                  size="small"
                  onClick={this.onAdd}
                >
                  <LocalizedString text={addLabel} />
                </ReactUI.Button>
              </ReactUI.Block>
            )}
          </ReactUI.Block>
        );
      }

      onAdd = () => {
        transformFormValue(this.props.formValue, value => {
          value.push({});
          return value;
        });
      };

      onRemove = idx => {
        transformFormValue(this.props.formValue, value => {
          value.splice(idx, 1);
          if (value.length === 0) {
            value = null;
          }
          return value;
        });
      };
    }
  )
);

function transformFormValue(formValue, transform) {
  let value = formValue.value;
  if (!value) {
    value = [];
  } else {
    value = value.slice(0);
  }
  let nextValue = transform(value);
  formValue.update(nextValue);
}
