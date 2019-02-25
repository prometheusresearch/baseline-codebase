/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import * as ReactForms from "react-forms/reactive";

import { InjectI18N } from "rex-i18n";

import TextArea from "./widget/TextArea";
import QuestionLabel from "./QuestionLabel";

export default InjectI18N(
  ReactForms.reactive(
    class Annotation extends React.Component {
      state = { show: false };

      onShow = () => this.setState({ show: true });

      onHide = () => {
        this.setState({ show: false });
        this.props.formValue.update(null);
      };

      render() {
        let { formValue, required, disabled, readOnly } = this.props;
        let { show } = this.state;

        if (readOnly) {
          return (
            <ReactUI.Block>
              {formValue.value == null ? (
                <ReactUI.Text color="#888">
                  {this._("No annotation")}
                </ReactUI.Text>
              ) : (
                <ReactUI.Block>
                  <QuestionLabel text={this._("Annotation:")} />
                  <ReactUI.Text>{formValue.value}</ReactUI.Text>
                </ReactUI.Block>
              )}
            </ReactUI.Block>
          );
        } else {
          return (
            <ReactUI.Block>
              {show || required ? (
                <ReactUI.Block>
                  <QuestionLabel
                    text={this._(
                      "Please explain why you can't or won't respond to this question:"
                    )}
                    required={required}
                  />
                  {readOnly ? (
                    <ReactUI.Text>{formValue.value}</ReactUI.Text>
                  ) : (
                    <TextArea disabled={disabled} formValue={formValue} />
                  )}
                  {!required && (
                    <ReactUI.Block marginTop="xx-small">
                      <ReactUI.QuietButton
                        disabled={disabled}
                        size="small"
                        onClick={this.onHide}
                      >
                        {this._("I don't want to provide this information.")}
                      </ReactUI.QuietButton>
                    </ReactUI.Block>
                  )}
                </ReactUI.Block>
              ) : (
                <ReactUI.QuietButton
                  tabIndex={-1}
                  disabled={disabled}
                  size="small"
                  onClick={this.onShow}
                >
                  {this._("I can't (or won't) respond to this question.")}
                </ReactUI.QuietButton>
              )}
            </ReactUI.Block>
          );
        }
      }
    }
  )
);
