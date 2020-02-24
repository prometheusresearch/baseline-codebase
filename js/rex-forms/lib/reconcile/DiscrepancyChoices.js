/**
 * @copyright 2014-present, Prometheus Research, LLC
 * @flow
 */

import invariant from "invariant";
import * as React from "react";
import Moment from "moment";
import PropTypes from "prop-types";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";
import { style } from "@prometheusresearch/react-ui-0.21/stylesheet";

import { InjectI18N } from "rex-i18n";

import * as s from "../instrument/schema.js";
import * as types from "../types.js";
import * as FormContext from "../form/FormContext";
import * as FormFormatConfig from "../form/FormFormatConfig.js";
import QuestionValue from "../form/QuestionValue";
import { resolveWidget, defaultViewWidgetConfig } from "../form/WidgetConfig";
import Header from "./Header";

function Value(props, context) {
  let { instrument, question } = props;
  const [Widget, options] = resolveWidget(
    context.widgetConfig,
    instrument,
    question,
    "view",
  );
  let widget = (
      // $FlowFixMe: ...
      <Widget
        {...props}
        readOnly={true}
        asDiscrepancy={true}
        options={options}
      />
  );
  return (
    <div style={{ textAlign: "initial", lineHeight: "initial" }}>
      {widget}
    </div>
  );
}

Value.contextTypes = FormContext.contextTypes;

let ValueButton = style(ReactUI.QuietButton, {
  Caption: props => <div style={{ maxWidth: "100%" }} {...props} />,
});

type DiscrepancyChoicesProps = {|
  discrepancy: types.Discrepancy,
  question: types.RIOSQuestion,
  instrument: types.RIOSField,
  formValue: types.FormValue,
  entries: types.DiscrepancyEntry[],
|};

type DiscrepancyChoicesState = {|
  manualOverride: boolean,
|};

class DiscrepancyChoices extends React.Component<
  DiscrepancyChoicesProps,
  DiscrepancyChoicesState,
> {
  _: any;
  static propTypes = {
    discrepancy: PropTypes.object.isRequired,
    question: PropTypes.object.isRequired,
    instrument: PropTypes.object.isRequired,
    formValue: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      manualOverride: false,
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
      showEmptyOption: true,
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

  renderValue(value: types.RIOSValue) {
    let { question, formValue, instrument } = this.props;

    let schema = formValue.schema;
    let field = s.field(schema);
    let valueFormatted = FormFormatConfig.formatValue(
      field,
      schema.fieldConfig,
      value,
    );
    let discrepancyFormValue = {
      value: valueFormatted,
      schema,
      params: {},
      errorList: [],
      completeErrorList: [],
    };
    let active = formValue.value === valueFormatted;

    return (
      <ValueButton
        style={{ maxWidth: "100%" }}
        variant={{ active }}
        onClick={this.updateValue.bind(null, valueFormatted)}
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
    let values = Object.keys(discrepancy)
      .sort()
      .map(key => {
        let value = this.renderValue(discrepancy[key]);
        return (
          <td style={{ verticalAlign: "top" }} key={key}>
            <ReactUI.Block>{value}</ReactUI.Block>
          </td>
        );
      })
      .concat(
        <td style={{ verticalAlign: "top" }} key="_final_value">
          <ReactUI.Block paddingV="x-small" paddingH="small">
            {this.renderFinalValue()}
          </ReactUI.Block>
        </td>,
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

  renderFinalValue() {
    let { question, formValue, instrument } = this.props;
    let schema = formValue.schema;
    let field = s.field(schema);
    return (
      <Value
        instrument={instrument}
        question={question}
        formValue={formValue}
        noValueText="-"
      />
    );
  }
}

export default InjectI18N(DiscrepancyChoices);
