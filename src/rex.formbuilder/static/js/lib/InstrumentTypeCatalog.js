/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var merge = require('n-deep-merge');

var {ParsingError} = require('./errors');
var _ = require('./i18n').gettext;


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


class InstrumentTypeCatalog {
  constructor(instrument) {
    var catalog = {};

    // Populate the catalog with the built-in types.
    INSTRUMENT_BASE_TYPES.forEach((type) => {
      catalog[type] = this._getBuiltInDefinition(type);
    });

    // Populate it with the custom types.
    var instrumentTypes = instrument.types || {};
    for (var name in instrumentTypes) {
      catalog[name] = this._buildCatalogDefinition(name, instrumentTypes);
    }

    this.catalog = catalog;
  }

  getTypeDefinition(type) {
    // If it's a type name that's in our catalog, return it.
    if (this.catalog.hasOwnProperty(type)) {
      return this.catalog[type];
    }

    // If it's an inline-style type definition with a base in our catalog,
    // then merge the customization and base.
    if (type.base && this.catalog.hasOwnProperty(type.base)) {
      return merge({}, this.catalog[type.base], type);
    }

    throw new ParsingError(_(
      'Could not retrieve type definition for "%(type)s"',
      {type: type.base || type}
    ));
  }

  _getBuiltInDefinition(name) {
    return {
      base: null,
      rootType: name
    };
  }

  _buildCatalogDefinition(typeName, instrumentTypes) {
    var type = instrumentTypes[typeName];

    // Handle the built-in types.
    if (INSTRUMENT_BASE_TYPES.indexOf(typeName) >= 0) {
      return this._getBuiltInDefinition(typeName);
    }

    // If the base of this type is a built-in type, just return it
    // with rootType notated.
    if (INSTRUMENT_BASE_TYPES.indexOf(type.base) >= 0) {
      return merge({rootType: type.base}, type);
    }

    // Otherwise, recursively build the base types and merge it with us.
    var base = this._buildCatalogDefinition(type.base, instrumentTypes);
    return merge(base, type);
  }
}


module.exports = InstrumentTypeCatalog;

