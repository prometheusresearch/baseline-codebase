/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';

import map from 'lodash/map';

import {isCompleteComposite} from './Discrepancy';
import DiscrepancyTitle from './DiscrepancyTitle';
import DiscrepancyChoices from './DiscrepancyChoices';
import PositionDescription from './PositionDescription';

export default class RecordListDiscrepancy extends React.Component {

  render() {
    let {formValue, discrepancy, entries} = this.props;
    let {schema} = formValue;
    let {form: {question, position}} = schema;
    let complete = isCompleteComposite(formValue, discrepancy);
    let subtitle = null;
    if (position) {
      subtitle = <PositionDescription {...position} />;
    }
    let records = map(discrepancy, (discrepancy, idx) =>
      <RecordListItemDiscrepancy
        entries={entries}
        key={idx}
        discrepancy={discrepancy}
        formValue={formValue.select(parseInt(idx, 10))}
        />
    );
    let header = (
      <DiscrepancyTitle
        complete={complete}
        title={question.text}
        subtitle={subtitle}
        required={schema.required}
        />
    );
    return (
      <ReactUI.Card header={header} marginBottom="medium" variant={{success: complete}}>
        <ReactUI.Block padding="small">
          {records}
        </ReactUI.Block>
      </ReactUI.Card>
    );
  }
}

function RecordListItemDiscrepancy({formValue, discrepancy, entries}) {
  let records = map(discrepancy, (discrepancy, fieldId) =>
    <RecordListItemRecordDiscrepancy
      entries={entries}
      key={fieldId}
      formValue={formValue.select(fieldId)}
      discrepancy={discrepancy}
      />
  );
  return (
    <ReactUI.Block>
      {records}
    </ReactUI.Block>
  );
}

function RecordListItemRecordDiscrepancy({entries, formValue, discrepancy}) {
  let {schema} = formValue;
  let {form: {question}, instrument} = schema;
  let header = (
    <DiscrepancyTitle
      title={question.text}
      required={instrument.field.required}
      />
  );
  return (
    <ReactUI.Card header={header} marginBottom="medium">
      <ReactUI.Block padding="small">
        <DiscrepancyChoices
          discrepancy={discrepancy}
          entries={entries}
          formValue={formValue}
          question={question}
          instrument={instrument}
          />
      </ReactUI.Block>
    </ReactUI.Card>
  );
}
