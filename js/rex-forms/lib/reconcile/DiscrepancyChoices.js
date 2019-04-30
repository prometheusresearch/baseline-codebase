/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from "react";
import PropTypes from 'prop-types';
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import { style } from "@prometheusresearch/react-ui-0.21/stylesheet";

import { InjectI18N } from "rex-i18n";

import * as FormContext from "../form/FormContext";
import QuestionValue from "../form/QuestionValue";
import { resolveWidget, defaultViewWidgetConfig } from "../form/WidgetConfig";
import Header from "./Header";

function Value(props, context) {
  let { instrument, question } = props;
  const [Widget, options] = resolveWidget(
    context.widgetConfig,
    instrument,
    question,
    "view"
  );
  return (
    <div style={{ textAlign: "initial", lineHeight: "initial" }}>
      <Widget
        {...props}
        readOnly={true}
        asDiscrepancy={true}
        options={options}
      />
    </div>
  );
}

Value.contextTypes = FormContext.contextTypes;

let ValueButton = style(ReactUI.QuietButton, {
  Caption: props => <div style={{ maxWidth: "100%" }} {...props} />
});

export default InjectI18N(
  class DiscrepancyChoices extends React.Component {
    static propTypes = {
      discrepancy: PropTypes.object.isRequired,
      question: PropTypes.object.isRequired,
      instrument: PropTypes.object.isRequired,
      formValue: PropTypes.object.isRequired
    };

    constructor(props) {
      super(props);
      this.state = {
        manualOverride: false
      };
    }

    onManualOverride = manualOverride => {
      this.props.formValue.update(manualOverride ? null : undefined);
      this.setState({ manualOverride });
    };

    updateValue = value => {
      if (this.state.manualOverride) {
        this.setState({ manualOverride: false });
      }
      this.props.formValue.update(value);
    };

    render() {
      let { formValue, question, instrument, discrepancy } = this.props;
      let { manualOverride } = this.state;
      let values = this.renderValues(discrepancy);
      let widgetProps = {
        noClearButton: true,
        showEmptyOption: true
      };
      return (
        <div>
          {values}
          <ReactUI.Block marginTop="small">
            <ReactUI.Block>
              <ReactUI.Checkbox
                label={this._("Manual Override")}
                value={manualOverride}
                onChange={this.onManualOverride}
              />
            </ReactUI.Block>
            {manualOverride && (
              <ReactUI.Block marginTop="small">
                <QuestionValue
                  noLabel
                  noHelp
                  noAudio
                  widgetProps={widgetProps}
                  disabled={!manualOverride}
                  question={question}
                  instrument={instrument}
                  form={formValue.schema.form}
                  formValue={formValue}
                />
              </ReactUI.Block>
            )}
          </ReactUI.Block>
        </div>
      );
    }

    renderValue(value) {
      let { question, formValue, instrument } = this.props;
      let active = formValue.value === value;

      let discrepancyFormValue = {
        value,
        schema: formValue.schema,
        params: {},
        errorList: [],
        completeErrorList: []
      };

      return (
        <ValueButton
          style={{ maxWidth: "100%" }}
          variant={{ active }}
          onClick={this.updateValue.bind(null, value)}
        >
          <Value
            instrument={instrument}
            question={question}
            formValue={discrepancyFormValue}
            noValueText="-"
          />
        </ValueButton>
      );
    }

    renderValues(discrepancy) {
      let { question, formValue, instrument } = this.props;

      let values = Object.keys(discrepancy)
        .sort()
        .map(key => {
          let value = this.renderValue(discrepancy[key]);
          return (
            <td
              style={{
                verticalAlign: "top"
              }}
              key={key}
            >
              <ReactUI.Block>{value}</ReactUI.Block>
            </td>
          );
        })
        .concat(
          <td
            style={{
              verticalAlign: "top"
            }}
            key="_final_value"
          >
            <ReactUI.Block paddingV="x-small" paddingH="small">
              <Value
                instrument={instrument}
                question={question}
                formValue={formValue}
                noValueText="-"
              />
            </ReactUI.Block>
          </td>
        );

      return (
        <table style={{ width: "100%", tableLayout: "fixed" }}>
          <Header entries={this.props.entries} />
          <tbody>
            <tr>{values}</tr>
          </tbody>
        </table>
      );
    }
  }
);
