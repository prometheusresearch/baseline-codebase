/**
 * @flow
 */

import type {
  Context,
  Query,
  QueryAtom,
  QueryPipeline,
  NavigateQuery,
  Expression,
} from '../model/types';

import invariant from 'invariant';
import * as q from '../model/Query';

const HERE = ['here'];

const LOGICAL_BINARY_OP_ENCODE = {
  and: '&',
  or: '|',
};

const UNARY_OP_ENCODE = {
  not: '!',
  exists: 'exists',
};

const BINARY_OP_ENCODE = {
  equal: '=',
  notEqual: '!=',
  less: '<',
  lessEqual: '<=',
  greater: '>',
  greaterEqual: '>=',
  contains: '~',
};

export type SerializedQuery = Array<SerializedQuery> | string | boolean | number | null;

export type TranslateOptions = {
  /**
   * Limit the output of seqs in select combinators
   */
  limitSelect?: ?number,
};

/**
 * Translate UI query model into query syntax.
 */
export default function translate(
  query: Query,
  options: TranslateOptions = {},
): SerializedQuery {
  const context = query.context.prev;
  return translateQuery(query, {translated: HERE, context}, options).translated;
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
  prev: SerializedQuery,
): SerializedQuery {
  let path = query.regular ? regularize(query) : query.path;
  if (prev !== HERE) {
    return ['.', prev, ['navigate', path]];
  } else {
    return ['navigate', path];
  }
}

function translateExpression(query: Expression, prev: SerializedQuery): SerializedQuery {
  switch (query.name) {
    case 'navigate':
      return translateNavigateQuery(query, prev);

    case 'value':
      return query.value;

    case 'unary':
      return [UNARY_OP_ENCODE[query.op], translateExpression(query.expression, prev)];

    case 'logicalBinary': {
      let expressions = query.expressions.map(expression =>
        translateExpression(expression, HERE),
      );
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
          // $FlowFixMe: refine doesn't work!
          ...right.value,
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
      invariant(false, 'Could not translate "%s" to a rex.query combinator', query.name);
  }
}

function partitionPipeline(query: QueryPipeline): [?QueryAtom, QueryPipeline] {
  let last = query.pipeline[query.pipeline.length - 1];
  if (last && last.name === 'select') {
    return [
      last,
      {
        id: query.id,
        name: 'pipeline',
        pipeline: query.pipeline.slice(0, query.pipeline.length - 1),
        context: query.context,
      },
    ];
  } else {
    return [null, query];
  }
}

type QueryTranslationResult = {
  translated: SerializedQuery,
  context: Context,
};

function translateQuery(
  query: Query,
  prev: QueryTranslationResult,
  options: TranslateOptions,
): QueryTranslationResult {
  switch (query.name) {
    case 'here':
      return prev;

    case 'pipeline': {
      const translation = query.pipeline.reduce((prev, q) => {
        const {translated} = translateQuery(q, prev, options);
        return {
          translated,
          context: q.context,
        };
      }, prev);
      return {
        translated: translation.translated,
        context: query.context,
      };
    }

    case 'navigate': {
      return {
        translated: translateNavigateQuery(query, prev.translated),
        context: query.context,
      };
    }

    case 'define': {
      const [select, pipeline] = partitionPipeline(query.binding.query);
      const path = regularizeName(query.binding.name);
      const binding = ['=>', path, translate(pipeline, options)];

      const selectTranslation = translateQuery(
        select != null ? q.pipeline(q.navigate(path), select) : q.navigate(path),
        {translated: HERE, context: query.context},
        options,
      );
      const bindingWithSelect = ['=>', query.binding.name, selectTranslation.translated];
      const translated = ['define', prev.translated, binding, bindingWithSelect];
      return {
        translated,
        context: query.context,
      };
    }

    case 'select': {
      const fields = [];
      const fieldsByName = {};

      for (const k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          const field = query.select[k];
          const fieldTranslation = translateQuery(
            query.select[k],
            {translated: HERE, context: query.context},
            options,
          );

          let {translated} = fieldTranslation;

          // Apply limit if needed
          if (options.limitSelect != null && field.context.type.card === 'seq') {
            translated = ['take', translated, options.limitSelect];
          }

          fields.push(['=>', k, translated]);
          fieldsByName[k] = translated;
        }
      }

      let translated = ['select', prev.translated].concat(fields);

      if (query.sort != null) {
        const {navigatePath, dir} = query.sort;
        const navigation = navigatePath.length === 1
          ? ['navigate', navigatePath[0]]
          : ['.', ...navigatePath.map(nav => ['navigate', nav])];

        translated = ['sort', translated, [dir, navigation]];
      }

      return {translated, context: query.context};
    }

    case 'aggregate': {
      let translated = prev.translated;
      if (query.path != null) {
        translated = translateQuery(q.navigate(query.path), prev, options).translated;
      }
      translated = [query.aggregate, translated];
      return {
        translated,
        context: query.context,
      };
    }

    case 'group': {
      if (query.byPath.length === 0) {
        // Group by columns are not defined yet, skip the group by clause.
        return prev;
      } else {
        const translated = [
          'group',
          prev.translated,
          ...query.byPath.map(p => ['navigate', p]),
        ];
        return {
          translated,
          context: query.context,
        };
      }
    }

    case 'filter': {
      if (!query.predicate) {
        // Predicate hasn't been defined yet, skip the filter.
        return prev;
      } else {
        const translated = [
          'filter',
          prev.translated,
          translateExpression(query.predicate, HERE),
        ];
        return {
          translated,
          context: query.context,
        };
      }
    }

    default:
      invariant(false, 'Could not translate "%s" to a rex.query combinator', query.name);
  }
}
