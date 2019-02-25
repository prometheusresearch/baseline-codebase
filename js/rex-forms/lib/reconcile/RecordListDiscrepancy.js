/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';

import {inject} from 'rex-i18n';

import map from 'lodash/map';

import {isCompleteSimple, isCompleteComposite} from './Discrepancy';
import DiscrepancyTitle from './DiscrepancyTitle';
import DiscrepancyChoices from './DiscrepancyChoices';
import PositionDescription from './PositionDescription';
import ErrorList from '../form/ErrorList';


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
    let records = map(discrepancy, (discrepancy, idx) => {
      let recordId = parseInt(idx, 10);
      return (
        <RecordListRecordDiscrepancy
          id={recordId}
          entries={entries}
          key={idx}
          discrepancy={discrepancy}
          formValue={formValue.select(recordId)}
          questions={question.questions}
          />
      );
    });
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
        <ReactUI.Block
          paddingTop="x-small"
          paddingStart="x-small"
          paddingEnd="x-small">
          {records}
        </ReactUI.Block>
      </ReactUI.Card>
    );
  }
}

let RecordListRecordDiscrepancy = inject(function ({formValue, id, discrepancy, entries, questions}) {
  let subfields = [];
  questions.forEach((question) => {
    if (discrepancy[question.fieldId]) {
      subfields.push(
        <RecordListItemDiscrepancy
          entries={entries}
          key={question.fieldId}
          formValue={formValue.select(question.fieldId)}
          discrepancy={discrepancy[question.fieldId]}
          />
      );
    }
  });

  let complete = isCompleteSimple(formValue, discrepancy);
  Object.keys(discrepancy).filter((field) => field != '_NEEDS_VALUE_').forEach((field) => {
    if (!isCompleteSimple(formValue.select(field), discrepancy[field])) {
      complete = false;
    }
  });

  return (
    <ReactUI.Card
      header={this._('Record %(recordId)s', {recordId: id + 1})}
      marginBottom="medium"
      variant={{success: complete}}>
      <ReactUI.Block
        paddingTop="x-small"
        paddingStart="x-small"
        paddingEnd="x-small">
        {subfields}
      </ReactUI.Block>
      {formValue.completeErrorList.length > 0 &&
        <ReactUI.Block
          paddingStart="x-small"
          paddingBottom="x-small">
          <ErrorList formValue={formValue} />
        </ReactUI.Block>
      }
    </ReactUI.Card>
  );
});

function RecordListItemDiscrepancy({entries, formValue, discrepancy}) {
  let {schema} = formValue;
  let {form: {question}, instrument} = schema;
  let complete = isCompleteSimple(formValue, discrepancy);
  let header = (
    <DiscrepancyTitle
      title={question.text}
      required={instrument.field.required}
      />
  );
  return (
    <ReactUI.Card header={header} marginBottom="small" variant={{success: complete}}>
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
