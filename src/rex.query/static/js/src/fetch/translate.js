/**
 * @flow
 */

import type {Query, QueryPipeline, NavigateQuery, Expression} from '../model';

import invariant from 'invariant';
import * as feature from '../feature';
import * as q from '../model/Query';

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

function regularizeName(name) {
  return name + '__regular';
}

function regularize(query: NavigateQuery) {
  if (query.context.prev.scope[query.path] != null) {
    return regularizeName(query.path);
  } else {
    return query.path;
  }
}

function translateNavigateQuery(
  query: NavigateQuery,
  prev: SerializedQuery
): SerializedQuery {
  let path = query.regular
    ? regularize(query)
    : query.path;
  if (prev !== HERE) {
    return ['.', prev, ['navigate', path]];
  } else {
    return ['navigate', path];
  }
}

function translateExpression(
  query: Expression,
  prev: SerializedQuery
): SerializedQuery {
  switch (query.name) {
    case 'navigate':
      return translateNavigateQuery(query, prev);

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
      let {op, left, right} = query;
      if (
        (op === 'equal' || op === 'notEqual') &&
        right.name === 'value' &&
        Array.isArray(right.value)
      ) {
        return [
          BINARY_OP_ENCODE[op],
          translateExpression(left, HERE),
          // $FlowIssue: refine doesn't work!
          ...right.value
        ];
      } else {
        return [
          BINARY_OP_ENCODE[op],
          translateExpression(left, HERE),
          translateExpression(right, HERE),
        ];
      }
    }

    default:
      invariant(
        false,
        'Could not translate "%s" to a rex.query combinator',
        query.name,
      );
  }
}

function partitionPipeline(query: QueryPipeline): [?Query, QueryPipeline] {
  let last = query.pipeline[query.pipeline.length - 1];
  if (last && last.name === 'select') {
    return [
      last,
      {
        name: 'pipeline',
        pipeline: query.pipeline.slice(0, query.pipeline.length - 1),
        context: query.context,
      }
    ];
  } else {
    return [
      null,
      query
    ];
  }
}

function translateQuery(
  query: Query,
  prev: SerializedQuery
): SerializedQuery {
  switch (query.name) {
    case 'here':
      return prev;

    case 'pipeline': {
      let res = query.pipeline.reduce((prev, q) => {
        return translateQuery(q, prev);
      }, prev);
      return ((res: any): SerializedQuery);
    }

    case 'navigate':
      return translateNavigateQuery(query, prev);

    case 'define': {
      let [select, pipeline] = partitionPipeline(query.binding.query);
      let path = regularizeName(query.binding.name);
      return [
        'define',
        prev,
        ['=>',
          path,
          translate(pipeline)],
        ['=>',
          query.binding.name,
          select != null
            ? translate(q.pipeline(q.navigate(path), select))
            : translate(q.navigate(path))]
      ];
    }

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

    case 'aggregate': {
      if (query.path != null) {
        prev = translateQuery(q.navigate(query.path), prev);
      }
      return [query.aggregate, prev];
    }

    case 'group':
      if (query.byPath.length === 0) {
        return prev;
      } else {
        return ['group', prev, ...query.byPath.map(p => [p])];
      }

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


