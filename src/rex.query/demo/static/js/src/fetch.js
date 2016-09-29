/**
 * @flow
 */

import type {Query, Domain, DomainEntity} from './model/Query';
import type {Type} from './model/Type';

import download from 'downloadjs';
import invariant from 'invariant';

import * as t from './model/Type';

function fetchJSON(api: string, data: mixed): Promise<Object> {
  return window.fetch(api, {
    method: 'POST',
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

type Catalog = {
  entity: Array<CatalogEntity>;
};

type CatalogEntity = {
  name: string;
  label: string;
  field: Array<CatalogEntityField>;
};

type CatalogEntityField = {
  label: string;
  title: string;
  column: ?{type: string};
  public: boolean;
  partial: boolean;
  plural: boolean;
  kind: string;
  link: ?{target: string; inverse: string};
};

/**
 * Known aggregate functions are hard-coded now.
 */
const aggregate = {
  count: {
    makeType: _typ => t.numberType,
  },
};

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

function getBaseFieldType(field) {
  if (field.column != null) {
    switch (field.column.type) {
      case 'text':
      case 'date':
      case 'enum':
        return t.textType;
      case 'boolean':
        return t.booleanType;
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

/**
 * Translate UI query model into query syntax.
 */
export function translate(query: Query) {
  return translateImpl(query, null);
}

function translateImpl(query, prev) {
  switch (query.name) {
    case 'define':
      return [
        'define', prev,
        ['=>', query.binding.name, translate(query.binding.query)]
      ];
    case 'aggregate':
      return [query.aggregate, prev];
    case 'pipeline':
      return query.pipeline.reduce((prev, q) => {
        let tq = translateImpl(q, prev);
        return tq != null ? tq : q;
      }, prev);
    case 'select':
      let fields = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          fields.push(translateImpl(query.select[k], null));
        }
      }
      return ['select', prev].concat(fields);
    case 'navigate':
      if (prev != null) {
        return ['.', prev, ['navigate', query.path]];
      } else {
        return ['navigate', query.path];
      }
    default:
      return null;
  }
}
