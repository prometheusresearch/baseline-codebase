/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';

import SimpleDiscrepancy from './SimpleDiscrepancy';
import RecordListDiscrepancy from './RecordListDiscrepancy';
import MatrixDiscrepancy from './MatrixDiscrepancy';
import * as FormContext from '../form/FormContext';
import traverseQuestions from '../form/traverseQuestions';


export default class DiscrepancyList extends React.Component {
  static contextTypes = {
    ...FormContext.contextTypes,
  };

  render() {
    let {formValue, entries} = this.props;
    let discrepancies = [];

    traverseQuestions(this.context.form, (question) => {
      let {fieldId} = question;

      if (!formValue.schema.properties[fieldId]) {
        return;
      }

      let subFormValue = formValue.select(fieldId);
      let discrepancy = subFormValue.schema.discrepancy;
      switch (formValue.schema.properties[fieldId].instrument.type.base) {
        case 'recordList':
          discrepancies.push(
            <RecordListDiscrepancy
              entries={entries}
              discrepancy={discrepancy}
              key={fieldId}
              formValue={subFormValue}
              />
          );
          break;
        case 'matrix':
          discrepancies.push(
            <MatrixDiscrepancy
              entries={entries}
              discrepancy={discrepancy}
              key={fieldId}
              formValue={subFormValue}
              />
          );
          break;
        default:
          discrepancies.push(
            <SimpleDiscrepancy
              entries={entries}
              discrepancy={discrepancy}
              key={fieldId}
              formValue={subFormValue}
              />
          );
          break;
      }
    });

    return <div>{discrepancies}</div>;
  }
}

