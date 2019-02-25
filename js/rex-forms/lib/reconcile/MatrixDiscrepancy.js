/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui-0.21';

import LocalizedString from '../form/LocalizedString';
import MarkupString from '../form/MarkupString';

import {isCompleteSimple, isCompleteComposite} from './Discrepancy';
import DiscrepancyTitle from './DiscrepancyTitle';
import DiscrepancyChoices from './DiscrepancyChoices';
import PositionDescription from './PositionDescription';

export default class MatrixDiscrepancy extends React.Component {
  render() {
    let {formValue, discrepancy, entries} = this.props;
    let {schema} = formValue;
    let {form: {question, position}} = schema;
    let subtitle = null;
    if (position) {
      subtitle = <PositionDescription {...position} />;
    }
    let complete = isCompleteComposite(formValue, discrepancy);

    let rows = [];
    question.rows.forEach((row) => {
      if (discrepancy[row.id]) {
        rows.push(
          <MatrixRowDiscrepancy
            key={row.id}
            formValue={formValue.select(row.id)}
            discrepancy={discrepancy[row.id]}
            entries={entries}
            questions={question.questions}
          />
        );
      }
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
        <ReactUI.Block padding="x-small">
          {rows}
        </ReactUI.Block>
      </ReactUI.Card>
    );
  }
}

function MatrixRowDiscrepancy({entries, formValue, discrepancy, questions}) {
  let columns = [];
  questions.forEach((question) => {
    if (discrepancy[question.fieldId]) {
      columns.push(
        <MatrixColumnDiscrepancy
          key={question.fieldId}
          formValue={formValue.select(question.fieldId)}
          discrepancy={discrepancy[question.fieldId]}
          entries={entries}
          />
      );
    }
  });

  return (
    <ReactUI.Block marginBottom="small">
      {columns}
    </ReactUI.Block>
  );
}

function MatrixColumnDiscrepancy({entries, formValue, discrepancy}) {
  let {schema} = formValue;
  let {form: {question, row}, instrument} = schema;
  let complete = isCompleteSimple(formValue, discrepancy);
  let title = (
    <span>
      <LocalizedString Component={MarkupString} inline text={row.text} />
      {' / '}
      <LocalizedString Component={MarkupString} inline text={question.text} />
    </span>
  );
  let header = (
    <DiscrepancyTitle
      title={title}
      required={instrument.field.required || instrument.row.required}
      />
  );
  return (
    <ReactUI.Card header={header} marginBottom="x-small" variant={{success: complete}}>
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

