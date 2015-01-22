/**
 * @copyright Prometheus Research, LLC
 */
'use strict';

var Immutable  = require('immutable');
var ReactForms = require('react-forms');
var invariant  = require('../invariant');

/**
 * Build schema from Rex Widget Form schema description.
 */
function buildSchema(desc) {
  switch (desc.__type__) {
    case 'scalar':
      return buildScalarNode(desc);
    case 'mapping':
      return buildMappingNode(desc);
    case 'list':
      return buildListNode(desc);
    default:
      invariant(false, `unknown schema type: ${desc.__type__}`);
  }
}

function buildScalarNode(desc) {
  return ReactForms.schema.Scalar({
    required: desc.required,
    defaultValue: desc.defaultValue,
    label: desc.label,
    hint: desc.hint,
    type: desc.type
  });
}

function buildMappingNode(desc) {
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
}

function buildListNode(desc) {
  var {
    children,
    label, hint,
    defaultValue, defaultChildValue,
    required, minChildren
  } = desc;
  defaultValue = Immutable.fromJS(defaultValue);
  defaultChildValue = Immutable.fromJS(defaultChildValue);
  return ReactForms.schema.List({
    defaultValue,
    defaultChildValue,
    label,
    hint,
    required,
    validate(node, value) {
      if (minChildren !== undefined && value.size < minChildren) {
        return new Error(`At least ${minChildren} items are required`);
      }
    }
  }, buildSchema(children));
}

module.exports = buildSchema;
