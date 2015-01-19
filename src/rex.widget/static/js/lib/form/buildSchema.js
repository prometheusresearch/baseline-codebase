/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var Immutable  = require('immutable');
var ReactForms = require('react-forms');

/**
 * Build schema from Rex Widget Form schema description.
 */
function buildSchema(desc) {
  switch (desc.__type__) {
    case 'scalar':
      return ReactForms.schema.Scalar({
        required: desc.required,
        defaultValue: desc.defaultValue,
        label: desc.label,
        hint: desc.hint,
        type: desc.type
      });
    case 'mapping':
      var children = {};
      for (var key in desc.children) {
        children[key] = buildSchema(desc.children[key]);
      }
      return ReactForms.schema.Mapping({
        required: desc.required,
        defaultValue: desc.defaultValue,
        label: desc.label,
        hint: desc.hint
      }, children);
    case 'list':
      var children = buildSchema(desc.children);
      return ReactForms.schema.List({
        required: desc.required,
        defaultValue: Immutable.fromJS(desc.defaultValue),
        defaultChildValue: Immutable.fromJS(desc.defaultChildValue),
        label: desc.label,
        hint: desc.hint
      }, children);
    default:
      throw new Error(`unknown schema type: ${desc.__type__}`);
  }
}

module.exports = buildSchema;
