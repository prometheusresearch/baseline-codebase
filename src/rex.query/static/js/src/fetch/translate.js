/**
 * @flow
 */

import type {Context, Query, QueryPipeline, NavigateQuery, Expression} from '../model';

import invariant from 'invariant';
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

export type SerializedQuery
  = Array<SerializedQuery>
  | string
  | boolean
  | number
  | null;

export type TranslateOptions = {

  /**
   * Limit the output of seqs in select combinators
   */
  limitSelect?: ?number;
};

/**
 * Translate UI query model into query syntax.
 */
export default function translate(query: Query, options: TranslateOptions = {}): SerializedQuery {
  let context = query.context.prev;
  return translateQuery(query, {translated: HERE, context}, options);
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
  prev: {translated: SerializedQuery, context: Context},
  options: TranslateOptions
): SerializedQuery {
  switch (query.name) {
    case 'here':
      return prev.translated;

    case 'pipeline': {
      let res = query.pipeline.reduce((prev, q) => {
        return {translated: translateQuery(q, prev, options), context: q.context};
      }, prev);
      return res.translated;
    }

    case 'navigate':
      return translateNavigateQuery(query, prev.translated);

    case 'define': {
      let [select, pipeline] = partitionPipeline(query.binding.query);
      let path = regularizeName(query.binding.name);
      return [
        'define',
        prev.translated,
        ['=>',
          path,
          translate(pipeline, options)],
        ['=>',
          query.binding.name,
          select != null
            ? translate(q.pipeline(q.navigate(path), select), options)
            : translate(q.navigate(path), options)]
      ];
    }

    case 'select': {
      let fields = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          let field = query.select[k];
          let fieldTranslated = translateQuery(
            query.select[k],
            {translated: HERE, context: query.context},
            options
          );
          if (options.limitSelect != null && field.context.type.card === 'seq') {
            fieldTranslated = ['take', fieldTranslated, options.limitSelect];
          }
          fields.push(['=>', k, fieldTranslated]);
        }
      }
      return ['select', prev.translated].concat(fields);
    }

    case 'aggregate': {
      let translated = prev.translated;
      if (query.path != null) {
        translated = translateQuery(q.navigate(query.path), prev, options);
      }
      return [query.aggregate, translated];
    }

    case 'group':
      if (query.byPath.length === 0) {
        // Group by columns are not defined yet, skip the group by clause.
        return prev.translated;
      } else {
        return ['group', prev.translated, ...query.byPath.map(p => [p])];
      }

    case 'filter':
      if (!query.predicate) {
        // Predicate hasn't been defined yet, skip the filter.
        return prev.translated;
      } else {
        return ['filter', prev.translated, translateExpression(query.predicate, HERE)];
      }

    default:
      invariant(
        false,
        'Could not translate "%s" to a rex.query combinator',
        query.name,
      );
  }
}


