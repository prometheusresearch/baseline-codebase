/**
 * @flow
 */

import type {Query, Domain, DomainEntity} from './model/Query';
import type {Type} from './model/Type';

import download from 'downloadjs';
import invariant from 'invariant';

import * as t from './model/Type';
import * as q from './model/Query';


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

function getBaseFieldType(field: CatalogEntityField) {
  if (field.column != null) {
    switch (field.column.type) {
      case 'text':
      case 'date':
        return t.textType;
      case 'enum':
        return t.enumerationType(field.column.enum);
      case 'boolean':
        return t.booleanType;
      case 'integer':
      case 'float':
        return t.numberType;
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


const HERE = ['here'];

const MULTI_BOOLEAN_OPS = {
  'and': '&',
  'or': '|',
};

const UNARY_OPS = {
  'not': '!',
  'exists': 'exists',
};

const BINARY_COMPARISON_OPS = {
  'equal': '=',
  'notEqual': '!=',
  'less': '<',
  'lessEqual': '<=',
  'greater': '>',
  'greaterEqual': '>=',
  'contains': '~',
};


type SerializedQuery = Array<string | boolean | number | null | SerializedQuery>;


/**
 * Translate UI query model into query syntax.
 */
export function translate(query: Query): SerializedQuery {
  return translateImpl(query, HERE);
}

function translateImpl(query: Query, prev: SerializedQuery): SerializedQuery {
  switch (query.name) {
    case 'here':
      return HERE;

    case 'pipeline':
      return query.pipeline.reduce((prev, q) => {
        let tq = translateImpl(q, prev);
        return tq != null ? tq : q;
      }, prev);

    case 'navigate':
      if (prev !== HERE) {
        return ['.', prev, ['navigate', query.path]];
      } else {
        return ['navigate', query.path];
      }

    case 'define':
      return [
        'define', prev,
        ['=>', query.binding.name, translate(query.binding.query)]
      ];

    case 'select':
      let fields = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          fields.push(['=>', k, translateImpl(query.select[k], HERE)]);
        }
      }
      return ['select', prev].concat(fields);

    case 'aggregate':
      return [query.aggregate, prev];

    case 'filter':
      if (!query.predicate) {
        // Predicate hasn't been defined yet, skip the filter.
        return prev;
      } else {
        return ['filter', prev, translateImpl(query.predicate, HERE)];
      }

    case 'not':
      return ['!', translateImpl(query.expression, prev)];

    default:
      if (query.name in MULTI_BOOLEAN_OPS) {
        let args = query.expressions.map((exp) => {
          if (q.isQuery(exp)) {
            exp = translateImpl(exp, HERE);
          }
          return exp;
        });
        args.unshift(MULTI_BOOLEAN_OPS[query.name]);
        return args;

      } else if (query.name in UNARY_OPS) {
        let {expression} = query;
        if (q.isQuery(expression)) { expression = translateImpl(expression, HERE); }

        return [UNARY_OPS[query.name], expression];

      } else if (query.name in BINARY_COMPARISON_OPS) {
        let {left, right} = query;
        if (q.isQuery(left)) { left = translateImpl(left, HERE); }
        if (q.isQuery(right)) { right = translateImpl(right, HERE); }

        return [BINARY_COMPARISON_OPS[query.name], left, right];

      } else {
        invariant(
          false,
          'Could not translate "%s" to a rex.query combinator',
          query.name,
        );
      }
  }
}

