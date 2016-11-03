/**
 * @flow
 */

import type {Query, Expression} from '../model/Query';

import invariant from 'invariant';
import * as feature from '../feature';

const HERE = ['here'];

const LOGICAL_BINARY_OP_ENCODE = {
  'and': '&',
  'or': '|',
};

const UNARY_OP_ENCODE = {
  'not': '!',
  'exists': 'exists',
};

const BINARY_OP_ENCODE = {
  'equal': '=',
  'notEqual': '!=',
  'less': '<',
  'lessEqual': '<=',
  'greater': '>',
  'greaterEqual': '>=',
  'contains': '~',
};

type SerializedQuery
  = Array<SerializedQuery>
  | string
  | boolean
  | number
  | null;

/**
 * Translate UI query model into query syntax.
 */
export default function translate(query: Query): SerializedQuery {
  return translateQuery(query, HERE);
}

function translateExpression(
  query: Expression,
  prev: SerializedQuery
): SerializedQuery {
  switch (query.name) {
    case 'navigate':
      if (prev !== HERE) {
        return ['.', prev, ['navigate', query.path]];
      } else {
        return ['navigate', query.path];
      }

    case 'value':
      return query.value;

    case 'unary':
      return [UNARY_OP_ENCODE[query.op], translateExpression(query.expression, prev)];

    case 'logicalBinary': {
      let expressions = query.expressions.map(expression =>
        translateExpression(expression, HERE));
      return [LOGICAL_BINARY_OP_ENCODE[query.op], ...expressions];
    }

    case 'binary': {
      return [
        BINARY_OP_ENCODE[query.op],
        translateExpression(query.left, HERE),
        translateExpression(query.right, HERE),
      ];
    }

    default:
      invariant(
        false,
        'Could not translate "%s" to a rex.query combinator',
        query.name,
      );
  }
}

function translateQuery(
  query: Query,
  prev: SerializedQuery
): SerializedQuery {
  switch (query.name) {
    case 'here':
      return HERE;

    case 'pipeline': {
      let res = query.pipeline.reduce((prev, q) => {
        return translateQuery(q, prev);
      }, prev);
      return ((res: any): SerializedQuery);
    }

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

    case 'select': {
      let fields = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          let kquery = translateQuery(query.select[k], HERE);
          fields.push(['=>', k, kquery]);
        }
      }
      if (feature.FEATURE_ARTIFICIAL_DATASET_LIMIT != null) {
        if (Array.isArray(prev) && prev[0] === 'navigate') {
          prev = ['take', prev, feature.FEATURE_ARTIFICIAL_DATASET_LIMIT];
        }
      }
      return ['select', prev].concat(fields);
    }

    case 'aggregate':
      return [query.aggregate, prev];

    case 'filter':
      if (!query.predicate) {
        // Predicate hasn't been defined yet, skip the filter.
        return prev;
      } else {
        return ['filter', prev, translateExpression(query.predicate, HERE)];
      }

    default:
      invariant(
        false,
        'Could not translate "%s" to a rex.query combinator',
        query.name,
      );
  }
}


