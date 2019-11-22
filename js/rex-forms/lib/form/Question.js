/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactForms from "react-forms/reactive";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import noop from "lodash/noop";

import { InjectI18N } from "rex-i18n";

import focusFirstWithin from "../focusFirstWithin";
import { isEmptyValue } from "../instrument/validate";
import QuestionValue from "./QuestionValue";
import Explanation from "./Explanation";
import Annotation from "./Annotation";

export default InjectI18N(
  ReactForms.reactive(
    class Question extends React.Component {
      static defaultProps = {
        onEditable: noop,
      };

      shouldComponentUpdate(nextProps) {
        // Prevent updates unless one of the prop is changed, not that we don't
        // react on formValue changes as component is marked as reactive and will
        // re-render if value changes.
        return (
          this.props.question !== nextProps.question ||
          this.props.plain !== nextProps.plain ||
          this.props.editable !== nextProps.editable ||
          this.props.disabled !== nextProps.disabled ||
          this.props.mode !== nextProps.mode
        );
      }

      render() {
        let {
          formValue,
          question,
          plain,
          editable,
          disabled,
          mode,
        } = this.props;
        let { field } = formValue.schema.instrument;

        let renderAnnotation =
          formValue.schema.properties.annotation &&
          isEmptyValue(formValue.select("value").value);

        let renderExplanation = formValue.schema.properties.explanation;

        let Component = plain ? ReactUI.Block : ReactUI.Card;

        let readOnly = (mode === "review" && !editable) || mode === "view";
        let style = {
          cursor: disabled ? "not-allowed" : undefined,
        };

        return (
          <Component
            padding="small"
            marginBottom={plain ? undefined : "medium"}
            style={style}
          >
            <QuestionValue
              disabled={disabled}
              editable={editable}
              onCommitEdit={this.onCommitEdit}
              onCancelEdit={this.onCancelEdit}
              readOnly={readOnly}
              marginBottom={
                renderAnnotation || renderExplanation ? "small" : undefined
              }
              question={question}
              instrument={formValue.schema.instrument}
              form={formValue.schema.form}
              formValue={formValue.select("value")}
            />
            {renderExplanation && (
              <ReactUI.Block
                marginStart="small"
                marginBottom={renderAnnotation ? "small" : undefined}
              >
                <Explanation
                  disabled={disabled}
                  readOnly={readOnly}
                  required={field.explanation === "required"}
                  formValue={formValue.select("explanation")}
                />
              </ReactUI.Block>
            )}
            {renderAnnotation && (
              <ReactUI.Block marginStart="small">
                <Annotation
                  disabled={disabled}
                  readOnly={readOnly}
                  required={field.annotation === "required"}
                  formValue={formValue.select("annotation")}
                />
              </ReactUI.Block>
            )}
            {mode === "review" &&
              (editable ? (
                <ReactUI.Block position="absolute" top={10} positionEnd={10}>
                  <ReactUI.Block inline marginRight="xx-small">
                    <ReactUI.FlatSuccessButton
                      disabled={
                        formValue.select("value").completeErrorList.length > 0
                      }
                      size="small"
                      onClick={this.onCommitEdit}
                    >
                      {this._("Save")}
                    </ReactUI.FlatSuccessButton>
                  </ReactUI.Block>
                  <ReactUI.Block inline>
                    <ReactUI.FlatDangerButton
                      size="small"
                      onClick={this.onCancelEdit}
                    >
                      {this._("Cancel")}
                    </ReactUI.FlatDangerButton>
                  </ReactUI.Block>
                </ReactUI.Block>
              ) : (
                <ReactUI.Block position="absolute" top={10} positionEnd={10}>
                  <ReactUI.FlatButton
                    onClick={this.onEditable}
                    size="small"
                    disabled={disabled}
                  >
                    {this._("Edit")}
                  </ReactUI.FlatButton>
                </ReactUI.Block>
              ))}
          </Component>
        );
      }

      componentDidUpdate(prevProps) {
        if (this.props.editable && !prevProps.editable) {
          focusFirstWithin(ReactDOM.findDOMNode(this));
        }
      }

      onEditable = () => {
        this.props.onEditable({ editable: true });
      };

      onCommitEdit = () => {
        if (
          this.props.formValue.select("value").completeErrorList.length === 0
        ) {
          this.props.onEditable({ editable: false, commit: true });
        }
      };

      onCancelEdit = () => {
        this.props.onEditable({ editable: false, commit: false });
      };
    },
  ),
);
