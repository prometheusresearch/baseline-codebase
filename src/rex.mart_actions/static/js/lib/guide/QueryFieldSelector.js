/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {VBox} from 'rex-widget/layout';

import {CheckboxButton} from '../ui';
import * as AST from './htsql/AST';

export default class QueryFieldSelector extends React.Component {

  render() {
    let {query, fields} = this.props;
    let {projection} = findProjection(query);
    let selectedFields = []
    if (projection !== null) {
      selectedFields = projection.fields.map(field =>
        AST.Alias.is(field) ? field.field.field : field.field);
    }
    return (
      <VBox>
        {fields.map(field =>
          <CheckboxButton
            key={field.expression}
            name={field.expression}
            label={field.title}
            value={selectedFields.indexOf(field.expression) > -1}
            onChange={this._onChange.bind(this, field)}
            />)}
      </VBox>
    );
  }

  _onChange(field, value) {
    let {query, onQueryUpdate} = this.props;
    let nextQuery = updateProjection(query, projection =>
      value ?
        addFieldToProjection(projection, field.expression, field.title) :
        removeFieldFromProjection(projection, field.expression));
    onQueryUpdate(nextQuery);
  }
}

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

function updateProjection(query, func) {
  let {index, projection} = findProjection(query);
  let refine = query.refine.slice(0);
  let nextProjection = func(projection);
  refine.splice(index, 1, nextProjection);
  return new AST.Collection(query.name, refine);
}

function removeFieldFromProjection(projection, field) {
  let fields = projection.fields.filter(f => {
    if (f instanceof AST.Alias) {
      f = f.field;
    }
    return f.field !== field
  });
  return new AST.Projection(fields);
}

function addFieldToProjection(projection, field, alias) {
  let node = new AST.Field(field);
  if (alias && (field !== alias)) {
    node = new AST.Alias(node, alias);
  }
  let fields = projection.fields.concat(node);
  return new AST.Projection(fields);
}

