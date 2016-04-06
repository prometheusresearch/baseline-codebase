/**
 * @jsx React.DOM
 */
'use strict';

var ReactForms = require('react-forms');
var Schema     = ReactForms.schema.Schema;
var Property   = ReactForms.schema.Property;
var List       = ReactForms.schema.List;

var merge      = require('./utils').merge;
var types      = require('./types');
var validators = require('./validators');

var SIMPLE_INSTRUMENT_BASE_TYPES = [
  'float',
  'integer',
  'text',
  'enumeration',
  'enumerationSet',
  'boolean',
  'date',
  'time',
  'dateTime'
];

var COMPLEX_INSTRUMENT_BASE_TYPES = [
  'recordList',
  'matrix'
];

var INSTRUMENT_BASE_TYPES = SIMPLE_INSTRUMENT_BASE_TYPES.concat(
  COMPLEX_INSTRUMENT_BASE_TYPES
);

function createSchema(instrument) {
  return SchemaBuilder.forInstrument(instrument);
}

function getBuiltInDefinition(name) {
  return {
    base: null,
    rootType: name
  };
}

function buildCatalogDefinition(typeName, instrumentTypes) {
  var type = instrumentTypes[typeName];

  // Handle the built-in types.
  if (INSTRUMENT_BASE_TYPES.indexOf(typeName) >= 0) {
    return getBuiltInDefinition(typeName);
  }

  // If the base of this type is a built-in type, just return it
  // with rootType notated.
  if (INSTRUMENT_BASE_TYPES.indexOf(type.base) >= 0) {
    return merge({rootType: type.base}, type);
  }

  // Otherwise, recursively build the base types and merge it with us.
  var base = buildCatalogDefinition(type.base, instrumentTypes);
  return merge(base, type);
}

function createTypeCatalog(instrumentTypes) {
  instrumentTypes = instrumentTypes || {};

  var catalog = {};

  // Populate the catalog with the built-in types.
  INSTRUMENT_BASE_TYPES.forEach((type) => {
    catalog[type] = getBuiltInDefinition(type);
  });

  for (var name in instrumentTypes) {
    catalog[name] = buildCatalogDefinition(name, instrumentTypes);
  }

  return catalog;
}


function getTypeDefinition(type, typeCatalog) {
  // If it's a type name that's in our catalog, return it.
  if (typeCatalog.hasOwnProperty(type)) {
    return typeCatalog[type];
  }

  // If it's an inline-style type definition with a base in our catalog,
  // then merge the customization and base.
  if (type.base && typeCatalog.hasOwnProperty(type.base)) {
    return merge(typeCatalog[type.base], type);
  }

  throw new Error(
    'Could not retrieve type definition for "' + (type.base || type) + '"'
  );
}

class SchemaBuilder {

  static forInstrument(instrument) {
    var builder = new SchemaBuilder(
      instrument.record,
      createTypeCatalog(instrument.types)
    );
    return builder.build();
  }

  constructor(record, typeCatalog) {
    this.record = record;
    this.typeCatalog = typeCatalog;
  }

  build() {
    var children = this.buildChildren();
    return Schema({}, children);
  }

  buildChildren() {
    return this.record.map((field) => this.buildProperty(field));
  }

  builderFor(record) {
    return new SchemaBuilder(record, this.typeCatalog);
  }

  buildProperty(field) {
    var type = getTypeDefinition(field.type, this.typeCatalog);

    var children = [this.buildValueProperty(field, type)];
    var annotationNeeded = (
      !field.required
      && field.annotation
      && field.annotation !== 'none'
    );

    if (annotationNeeded) {
      children.push(this.buildAnnotation(field, type));
    }

    if (field.explanation && field.explanation !== 'none') {
      children.push(this.buildExplanataion(field, type));
    }

    return Schema({
      isQuestion: true,
      name: field.id,
      annotation: field.annotation,
      validate: validators.validateAnnotation
    }, children);
  }

  buildAnnotation(field, type) {
    return Property({
      name: 'annotation',
      type: types.getForAnnotation(type, field),
      validate: validators.getForAnnotation(type, field)
    });
  }

  buildExplanataion(field, type) {
    return Property({
      name: 'explanation',
      type: types.getForExplanation(type, field),
      validate: validators.getForExplanation(type, field),
      required: field.explanation === 'required'
    });
  }

  buildValueProperty(field, type) {
    if (SIMPLE_INSTRUMENT_BASE_TYPES.indexOf(type.rootType) >= 0) {
      return this.buildSimpleProperty(field, type);
    }

    if (type.rootType === 'recordList') {
      return this.buildRecordListProperty(field, type);
    }

    if (type.rootType === 'matrix') {
      return this.buildMatrixProperty(field, type);
    }

    throw new Error('Unknown field type "' + type.rootType + '" encountered.');
  }

  buildSimpleProperty(field, type) {
    var propertyType = types.getForInstrumentType(type);

    return (
      <Property
        name='value'
        type={propertyType}
        validate={validators.getForInstrumentType(type)}
        required={field.required || false}
        defaultValue={propertyType.getDefaultValue()}
        instrumentType={type}
        />
    );
  }

  buildRecordListProperty(field, type) {
    var innerSchema = this.builderFor(type.record).build();
    return List({
      name: 'value',
      instrumentType: type,
      nonEmpty: field.required || false,
      validate: validators.getForInstrumentType(type)
    }, innerSchema);
  }

  buildMatrixProperty(field, type) {
    var columns = this.builderFor(type.columns).buildChildren();
    var rows = type.rows.map((row) =>
      Schema({name: row.id, required: row.required}, columns));
    return Schema({name: 'value', instrumentType: type, columns}, rows);
  }
}

module.exports = {
  SIMPLE_INSTRUMENT_BASE_TYPES: SIMPLE_INSTRUMENT_BASE_TYPES,
  COMPLEX_INSTRUMENT_BASE_TYPES: COMPLEX_INSTRUMENT_BASE_TYPES,
  INSTRUMENT_BASE_TYPES: INSTRUMENT_BASE_TYPES,
  createTypeCatalog: createTypeCatalog,
  getTypeDefinition: getTypeDefinition,
  createSchema: createSchema
};

