/**
 * @copyright 2014-present, Prometheus Research, LLC
 */

import * as React from 'react';
import map from 'lodash/map';

import SimpleDiscrepancy from './SimpleDiscrepancy';
import RecordListDiscrepancy from './RecordListDiscrepancy';
import MatrixDiscrepancy from './MatrixDiscrepancy';

export default class DiscrepancyList extends React.Component {

  render() {
    let {formValue, entries} = this.props;

    let discrepancies = map(formValue.schema.properties, (node, fieldId) => {
      let subFormValue = formValue.select(fieldId);
      let discrepancy = subFormValue.schema.discrepancy;
      switch (node.instrument.type.base) {
        case 'recordList':
          return (
            <RecordListDiscrepancy
              entries={entries}
              discrepancy={discrepancy}
              key={fieldId}
              formValue={subFormValue}
              />
          );
        case 'matrix':
          return (
            <MatrixDiscrepancy
              entries={entries}
              discrepancy={discrepancy}
              key={fieldId}
              formValue={subFormValue}
              />
          );
        default:
          return (
            <SimpleDiscrepancy
              entries={entries}
              discrepancy={discrepancy}
              key={fieldId}
              formValue={subFormValue}
              />
          );
      }
    });

    return <div>{discrepancies}</div>;
  }
}
