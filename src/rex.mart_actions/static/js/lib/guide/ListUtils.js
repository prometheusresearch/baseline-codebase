/**
 * @copyright 2016, Prometheus Research, LLC
 */

import * as AST from './htsql/AST';

function findProjection(query) {
  let projections = query.refine
    .filter(r => r instanceof AST.Projection)
    .map((projection, index) => ({projection, index}));
  if (projections.length > 0) {
    return projections[projections.length - 1];
  } else {
    return {projection: null, index: -1};
  }
}

function fieldToColumn(field) {
  if (field instanceof AST.Alias) {
    return {
      valueKey: [field.alias],
      label: field.alias
    };
  } else {
    return {
      valueKey: [field.field],
      label: field.field
    };
  }
}

export function columnsFromQuery(query) {
  return findProjection(query).projection.fields.map(fieldToColumn);
}
