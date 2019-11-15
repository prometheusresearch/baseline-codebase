/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from "react";
import * as ReactUI from "@prometheusresearch/react-ui-0.21";

import DiscrepancyTitle from "./DiscrepancyTitle";
import DiscrepancyChoices from "./DiscrepancyChoices";
import PositionDescription from "./PositionDescription";
import { isCompleteSimple } from "./Discrepancy";

export default class SimpleDiscrepancy extends React.Component {
  render() {
    let { formValue, discrepancy, entries } = this.props;
    let { schema } = formValue;
    let {
      form: { question, position },
      instrument,
    } = schema;
    let complete = isCompleteSimple(formValue, discrepancy);
    let subtitle = null;
    if (position) {
      subtitle = <PositionDescription {...position} />;
    }
    let header = (
      <DiscrepancyTitle
        complete={complete}
        title={question.text}
        subtitle={subtitle}
        required={instrument.field.required}
      />
    );
    return (
      <ReactUI.Card
        marginBottom="medium"
        header={header}
        variant={{ success: complete }}
      >
        <ReactUI.Block padding="small">
          <DiscrepancyChoices
            entries={entries}
            discrepancy={discrepancy}
            formValue={formValue}
            question={question}
            instrument={instrument}
          />
        </ReactUI.Block>
      </ReactUI.Card>
    );
  }
}
