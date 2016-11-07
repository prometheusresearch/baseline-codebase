/**
 * @flow
 */

import type {Query, Domain, DomainEntity} from '../model/Query';
import type {Type} from '../model/Type';

import download from 'downloadjs';
import invariant from 'invariant';

import * as t from '../model/Type';
import translate from './translate';

function fetchJSON(api: string, data: mixed): Promise<Object> {
  return window.fetch(api, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
  }).then(response => response.json());
}

export function initiateDownload(api: string, query: Query): Promise<Blob> {
  return window.fetch(api, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Accept': 'text/csv',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(translate(query)),
  })
  .then(response => response.blob())
  .then(blob => download(blob, 'query.csv', 'text/csv'));
}

export function fetch(api: string, query: Query): Promise<Object> {
  return fetchJSON(api, translate(query));
}

type CatalogEntityField = {
  label: string;
  title: string;
  column: ?{type: string, enum: Array<string>};
  public: boolean;
  partial: boolean;
  plural: boolean;
  kind: string;
  link: ?{target: string; inverse: string};
};

type CatalogEntity = {
  name: string;
  label: string;
  field: Array<CatalogEntityField>;
};

type Catalog = {
  entity: Array<CatalogEntity>;
};

/**
 * Known aggregate functions are hard-coded now.
 */
const aggregate = {
  count: {
    name: 'count',
    title: 'Count',
    makeType: _typ => t.numberType,
    isAllowed: typ => typ.name === 'seq' && isEntityLike(typ.type),
  },
  exists: {
    name: 'exists',
    title: 'Exists',
    makeType: _typ => t.booleanType,
    isAllowed: typ => typ.name === 'seq' && isEntityLike(typ.type),
  },
  sum: {
    name: 'sum',
    title: 'Sum',
    makeType: _typ => t.numberType,
    isAllowed: typ => typ.name === 'seq' && isNumeric(typ.type),
  },
  min: {
    name: 'min',
    title: 'Min',
    makeType: _typ => t.numberType,
    isAllowed: typ => typ.name === 'seq' && isNumeric(typ.type),
  },
  max: {
    name: 'max',
    title: 'Max',
    makeType: _typ => t.numberType,
    isAllowed: typ => typ.name === 'seq' && isNumeric(typ.type),
  },
  mean: {
    name: 'mean',
    title: 'Average',
    makeType: _typ => t.numberType,
    isAllowed: typ => typ.name === 'seq' && isNumeric(typ.type),
  },
};

function isNumeric(type: t.Type) {
  return (
    type.name === 'number' ||
    type.name === 'date' ||
    type.name === 'time' ||
    type.name === 'datetime'
  );
}

function isEntityLike(type: t.Type) {
  return (
    type.name === 'entity' ||
    type.name === 'record'
  );
}

export function fetchCatalog(api: string): Promise<Domain> {
  return fetchJSON(api, ['catalog']).then(data => {
    let catalog: Catalog = data;
    let entity: {[entityName: string]: DomainEntity} = {};
    catalog.entity.forEach(e => {
      let attribute = {};
      e.field.forEach(f => {
        attribute[f.label] = {
          title: f.title,
          type: getFieldType(f),
        };
      });
      entity[e.name] = {
        title: e.label,
        attribute
      };
    });
    return {entity, aggregate};
  });
}

function getFieldType(field: CatalogEntityField): Type {
  let type = getBaseFieldType(field);
  if (field.plural) {
    type = t.seqType(type);
  } else if (field.partial) {
    type = t.optType(type);
  }
  return type;
}

function getBaseFieldType(field: CatalogEntityField) {
  if (field.column != null) {
    switch (field.column.type) {
      case 'text':
        return t.textType;
      case 'enum':
        return t.enumerationType(field.column.enum);
      case 'boolean':
        return t.booleanType;
      case 'integer':
      case 'decimal':
      case 'float':
        return t.numberType;
      case 'date':
        return t.dateType;
      case 'time':
        return t.timeType;
      case 'datetime':
        return t.dateTimeType;
      default:
        invariant(false, 'Unknown column type: %s', field.column.type);
    }
  } else if (field.link != null) {
    return t.entityType(field.link.target);
  } else if (field.kind === 'calculation') {
    return t.textType;
  } else {
    invariant(false, 'Impossible');
  }
}
