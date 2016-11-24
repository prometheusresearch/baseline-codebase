/**
 * This module implements query model.
 *
 * @flow
 */

/* eslint-disable no-use-before-define */

import invariant from 'invariant';
import * as t from './Type';

export type HereQuery = {
  +name: 'here';
  +context: Context;
};

export type ValueQuery = {
  +name: 'value';
  +value: string | number | boolean | null;
  +context: Context;
};

export type NavigateQuery = {
  +name: 'navigate';
  +path: string;
  +context: Context;
};

export type SelectQuery = {
  +name: 'select';
  +select: {[name: string]: QueryPipeline};
  +context: Context;
};

type DefineQueryBinding = {
  +name: string;
  +query: QueryPipeline;
};

export type DefineQuery = {
  +name: 'define';
  +binding: DefineQueryBinding;
  +context: Context;
};

export type FilterQuery = {
  +name: 'filter';
  +predicate: Expression;
  +context: Context;
};

export type LimitQuery = {
  +name: 'limit';
  +limit: number;
  +context: Context;
};

export type AggregateQuery = {
  +name: 'aggregate';
  +aggregate: string;
  +context: Context;
};

export type GroupQuery = {
  +name: 'group';
  +byPath: Array<string>;
  +context: Context;
};

export type QueryPipeline = {
  +name: 'pipeline',
  +pipeline: Array<Query>;
  +context: Context;
};

export type BinaryOperator
  = 'equal'
  | 'notEqual'
  | 'less'
  | 'lessEqual'
  | 'greater'
  | 'greaterEqual'
  | 'greaterEqual'
  | 'contains';

export type BinaryQuery = {
  +name: 'binary';
  +op: BinaryOperator;
  +left: Expression;
  +right: Expression;
  +context: Context;
};

export type UnaryOperator
  = 'not'
  | 'exists';

export type UnaryQuery = {
  +name: 'unary';
  +op: UnaryOperator;
  +expression: Expression;
  +context: Context;
};

export type LogicalBinaryOperator
  = 'and'
  | 'or';

export type LogicalBinaryQuery = {
  +name: 'logicalBinary';
  +op: LogicalBinaryOperator;
  +expressions: Array<Expression>;
  +context: Context;
};


/**
 * Describe query structure.
 */
export type Query =
  | HereQuery
  | NavigateQuery
  | SelectQuery
  | DefineQuery
  | FilterQuery
  | LimitQuery
  | GroupQuery
  | AggregateQuery
  | QueryPipeline;


/**
 * Describe expression which are used in filter query.
 */
export type Expression =
  | ValueQuery
  | NavigateQuery
  | BinaryQuery
  | UnaryQuery
  | LogicalBinaryQuery
  | {name: 'query'; query: Query; context: Context};

/**
 * Set of queries in scope (by key).
 *
 * Usually those introduced by .define(name := ...) combinator.
 */
export type Scope = {
  [name: string]: DefineQueryBinding;
};

/**
 * Query context represents knowledge about query at any given point.
 */
export type Context = {|
  // link to the prev query context
  prev: Context;

  // domain
  domain: t.Domain;

  // scope which query can reference other queries from
  scope: Scope;

  // output type of the query, null means invalid type
  type: t.Type;
|};

export const emptyScope: Scope = {};
export const emptyDomain: t.Domain = {entity: {}, aggregate: {}};
export const emptyContext = {
  prev: ((null: any): Context),
  type: t.voidType(emptyDomain),
  scope: emptyScope,
  domain: emptyDomain,
};

emptyContext.prev = emptyContext;

export const here = {name: 'here', context: emptyContext};

export function value(value: number | string | boolean): ValueQuery {
  return {name: 'value', value, context: emptyContext};
}

export function navigate(path: string): NavigateQuery {
  return {name: 'navigate', path, context: emptyContext};
}

export function filter(predicate: Expression): FilterQuery {
  return {name: 'filter', predicate, context: emptyContext};
}

export function select(select: {[fieldName: string]: QueryPipeline}): SelectQuery {
  return {name: 'select', select, context: emptyContext};
}

export function def(name: string, query: QueryPipeline): DefineQuery {
  return {name: 'define', binding: {name, query}, context: emptyContext};
}

export function limit(limit: number): LimitQuery {
  return {name: 'limit', limit, context: emptyContext};
}

export function aggregate(aggregate: string): AggregateQuery {
  return {name: 'aggregate', aggregate, context: emptyContext};
}

export function group(byPath: Array<string>): GroupQuery {
  return {name: 'group', byPath, context: emptyContext};
}

export function pipeline(...pipeline: Array<Query>): QueryPipeline {
  return {name: 'pipeline', pipeline, context: emptyContext};
}

export function and(...expressions: Array<Expression>): LogicalBinaryQuery {
  return {name: 'logicalBinary', op: 'and', expressions, context: emptyContext};
}

export function or(...expressions: Array<Expression>): LogicalBinaryQuery {
  return {name: 'logicalBinary', op: 'or', expressions, context: emptyContext};
}

export function not(expression: Expression): UnaryQuery {
  return {name: 'unary', op: 'not', expression, context: emptyContext};
}

export function equal(left: Expression, right: Expression): BinaryQuery {
  return {name: 'binary', op: 'equal', left, right, context: emptyContext};
}

export function notEqual(left: Expression, right: Expression): BinaryQuery {
  return {name: 'binary', op: 'notEqual', left, right, context: emptyContext};
}

export function less(left: Expression, right: Expression): BinaryQuery {
  return {name: 'binary', op: 'less', left, right, context: emptyContext};
}

export function lessEqual(left: Expression, right: Expression): BinaryQuery {
  return {name: 'binary', op: 'lessEqual', left, right, context: emptyContext};
}

export function greater(left: Expression, right: Expression): BinaryQuery {
  return {name: 'binary', op: 'greater', left, right, context: emptyContext};
}

export function greaterEqual(left: Expression, right: Expression): BinaryQuery {
  return {name: 'binary', op: 'greaterEqual', left, right, context: emptyContext};
}

export function contains(left: Expression, right: Expression): BinaryQuery {
  return {name: 'binary', op: 'contains', left, right, context: emptyContext};
}

export function exists(expression: Expression): UnaryQuery {
  return {name: 'unary', op: 'exists', expression, context: emptyContext};
}

function withContext<Q: Query>(query: Q, context: Context): Q {
  let nextQuery: any = {...query, context};
  return (nextQuery: Q);
}

export function inferExpressionType(context: Context, query: Expression): Expression {
  if (query.name === 'logicalBinary') {
    return {
      name: 'logicalBinary',
      op: query.op,
      expressions: query.expressions.map(expression =>
        inferExpressionType(context, expression)),
      context,
    };
  } else if (query.name === 'unary') {
    return {
      name: 'unary',
      op: query.op,
      expression: inferExpressionType(context, query.expression),
      context,
    };
  } else if (query.name === 'value') {
    return {
      name: 'value',
      value: query.value,
      context,
    };
  } else if (query.name === 'binary') {
    let left = inferExpressionType(context, query.left);
    let right = inferExpressionType(context, query.right);
    return {
      name: 'binary',
      op: query.op,
      left, right,
      context,
    };
  } else if (query.name === 'navigate') {
    return inferQueryType(context, query);
  } else {
    invariant(false, 'Unknown query type: %s', query.name);
  }
}

export function inferQueryType<Q: Query>(context: Context, query: Q): Q {
  const {domain, type, scope} = context;
  const invalidContext = {
    prev: context,
    domain,
    scope,
    type: t.invalidType(domain),
  };
  let nextQuery = transformQuery(query, {
    here: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      } else {
        return {
          name: 'here',
          context: {
            ...context,
            prev: context,
            type,
          },
        };
      }
    },
    pipeline: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let nextPipeline = [];
      let nextContext = query.pipeline.reduce(
        (context, query) => {
          let q = inferQueryType(context, query);
          nextPipeline.push(q);
          return q.context;
        },
        context
      );
      return {
        name: 'pipeline',
        pipeline: nextPipeline,
        context: {
          ...nextContext,
          prev: context,
        },
      };
    },
    filter: query => {
      return {
        name: 'filter',
        predicate: inferExpressionType(context, query.predicate),
        context
      };
    },
    limit: query => {
      return withContext(query, context);
    },
    select: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let baseType = t.regType(type);
      let nextSelect = {};
      let attribute = {};
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          let q = inferQueryType({
            prev: context,
            domain,
            scope,
            type: baseType,
          }, query.select[k]);
          nextSelect[k] = q;
          attribute[k] = {type: q.context.type};
        }
      }
      return {
        name: 'select',
        select: nextSelect,
        context: {
          prev: context,
          domain,
          scope,
          type: t.leastUpperBound(type, t.recordType(domain, attribute)),
        }
      };
    },
    define: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let pipeline = inferQueryType({
        prev: context.prev,
        domain,
        scope,
        type: t.regType(context.type),
      }, query.binding.query);
      let nextScope = {
        ...scope,
        [query.binding.name]: {
          name: query.binding.name,
          query: pipeline,
        }
      };
      let binding = {
        name: query.binding.name,
        query: ((pipeline: any): QueryPipeline)
      };
      return {
        name: 'define',
        binding,
        context: {
          prev: context,
          domain,
          scope: nextScope,
          type,
        }
      };
    },
    aggregate: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let aggregate = domain.aggregate[query.aggregate];
      if (aggregate == null) {
        // unknown aggregate
        return withContext(query, invalidContext);
      }
      // TODO: validate input type
      if (type.card !== 'seq') {
        // not a seq
        return withContext(query, invalidContext);
      }
      return withContext(query, {
        prev: context,
        domain,
        scope: {},
        type: aggregate.makeType(type),
      });
    },
    group: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      if (type.card !== 'seq') {
        return withContext(query, invalidContext);
      }
      let baseType = t.regType(type);
      if (baseType.name !== 'record') {
        return withContext(query, invalidContext);
      }

      const entity = baseType.entity;
      if (entity == null) {
        return withContext(query, invalidContext);
      }

      if (query.byPath.length === 0) {
        return {
          name: 'group',
          byPath: [],
          context: {
            prev: context,
            scope,
            domain,
            type: context.type,
          },
        };
      }

      let baseTypeAttribute = t.recordAttribute(baseType);

      let attribute = {};
      for (let i = 0; i < query.byPath.length; i++) {
        let k = query.byPath[i];
        if (baseTypeAttribute[k] != null) {
          attribute[k] = {
            type: baseTypeAttribute[k].type,
            groupBy: true,
          };
        } else if (scope[k] != null) {
          attribute[k] = {
            type: scope[k].query.context.type,
            groupBy: true,
          };
        } else {
          return withContext(query, invalidContext);
        }
      }

      attribute[entity] = {
        type: t.seqType(t.entityType(domain, entity)),
      };

      return withContext(query, {
        prev: context,
        domain,
        scope: {},
        type: t.seqType(t.recordType(domain, attribute)),
      });
    },
    navigate: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let baseType = t.regType(type);
      if (baseType.name === 'record') {
        let field = t.recordAttribute(baseType)[query.path];
        if (field != null) {
          return withContext(query, {
            prev: context,
            domain,
            scope: {},
            type: t.leastUpperBound(type, field.type),
          });
        }
        let definition = scope[query.path];
        if (definition != null) {
          return withContext(query, {
            prev: context,
            domain,
            scope: {},
            type: inferQueryType(context, definition.query).context.type,
          });
        }
        // unknown field
        return withContext(query, invalidContext);
      } else if (baseType.name === 'void') {
        let entity = domain.entity[query.path];
        if (entity != null) {
          return withContext(query, {
            prev: context,
            domain,
            scope,
            type: t.seqType(t.entityType(domain, query.path)),
          });
        }
        let definition = scope[query.path];
        if (definition != null) {
          return withContext(query, {
            prev: context,
            domain,
            scope,
            type: inferQueryType(context, definition.query).context.type,
          });
        }
        // unknown entity
        return withContext(query, invalidContext);
      } else {
        // can't navigate from this type
        return withContext(query, invalidContext);
      }
    },
  });
  return ((nextQuery: any): Q);
}

/**
 * Infer the type of the query in context of a domain.
 */
export function inferType<Q: Query>(domain: t.Domain, query: Q): Q {
  let context = {
    prev: emptyContext,
    domain,
    type: t.voidType(domain),
    scope: {}
  };
  return inferQueryType(context, query);
}

export function flattenPipeline(query: QueryPipeline): QueryPipeline {
  let pipeline = [];
  for (let i = 0; i < query.pipeline.length; i++) {
    let item = query.pipeline[i];
    if (item.name === 'pipeline') {
      pipeline = pipeline.concat(flattenPipeline(item));
    } else {
      pipeline.push(item);
    }
  }
  return {name: 'pipeline', pipeline, context: query.context};
}

type TransformQuery<A, B, C, R = Query> = {
  pipeline?: (query: QueryPipeline, a: A, b: B, c: C) => R;
  aggregate?: (query: AggregateQuery, a: A, b: B, c: C) => R;
  group?: (query: GroupQuery, a: A, b: B, c: C) => R;
  limit?: (query: LimitQuery, a: A, b: B, c: C) => R;
  here?: (query: HereQuery, a: A, b: B, c: C) => R;
  select?: (query: SelectQuery, a: A, b: B, c: C) => R;
  filter?: (query: FilterQuery, a: A, b: B, c: C) => R;
  define?: (query: DefineQuery, a: A, b: B, c: C) => R;
  navigate?: (query: NavigateQuery, a: A, b: B, c: C) => R;
  otherwise?: (query: Query, a: A, b: B, c: C) => R;
};

type TransformExpression<A, B, C, R = Expression> = {
  binary?: (query: BinaryQuery, a: A, b: B, c: C) => R;
  unary?: (query: UnaryQuery, a: A, b: B, c: C) => R;
  logicalBinary?: (query: LogicalBinaryQuery, a: A, b: B, c: C) => R;
  value?: (query: ValueQuery, a: A, b: B, c: C) => R;
  navigate?: (query: NavigateQuery, a: A, b: B, c: C) => R;
  otherwise?: (query: Expression, a: A, b: B, c: C) => R;
};

function fail<R>(query: Query | Expression): R {
  invariant(false, 'Do not know how to process: %s', query.name);
}

export function transformQuery<A, B, C, R>(
  query: Query,
  transform: TransformQuery<A, B, C, R>,
  a: A, b: B, c: C
): R {
  let otherwise = transform.otherwise || fail;
  switch (query.name) {
    case 'pipeline':
      return transform.pipeline
        ? transform.pipeline(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'aggregate':
      return transform.aggregate
        ? transform.aggregate(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'group':
      return transform.group
        ? transform.group(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'limit':
      return transform.limit
        ? transform.limit(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'here':
      return transform.here
        ? transform.here(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'select':
      return transform.select
        ? transform.select(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'filter':
      return transform.filter
        ? transform.filter(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'define':
      return transform.define
        ? transform.define(query, a, b, c)
        : otherwise(query, a, b, c);
    case 'navigate':
      return transform.navigate
        ? transform.navigate(query, a, b, c)
        : otherwise(query, a, b, c);
    default:
      invariant(false, 'Unknown query: %s', query.name);
  }
}

export function transformExpression<A, B, C, R>(
  expression: Expression,
  transform: TransformExpression<A, B, C, R>,
  a: A, b: B, c: C
): R {
  let otherwise = transform.otherwise || fail;
  switch (expression.name) {
    case 'value':
      return transform.value
        ? transform.value(expression, a, b, c)
        : otherwise(expression, a, b, c);
    case 'binary':
      return transform.binary
        ? transform.binary(expression, a, b, c)
        : otherwise(expression, a, b, c);
    case 'logicalBinary':
      return transform.logicalBinary
        ? transform.logicalBinary(expression, a, b, c)
        : otherwise(expression, a, b, c);
    case 'unary':
      return transform.unary
        ? transform.unary(expression, a, b, c)
        : otherwise(expression, a, b, c);
    case 'navigate':
      return transform.navigate
        ? transform.navigate(expression, a, b, c)
        : otherwise(expression, a, b, c);
    default:
      invariant(false, 'Unknown expression: %s', expression.name);
  }
}

function mapQueryPipeline(
  query: QueryPipeline,
  f: (q: Query) => Query
): QueryPipeline {
  let pipeline = query.pipeline.map(q => mapQuery(q, f));
  return {name: 'pipeline', ...f(query), pipeline};
}

export function mapQuery(query: Query, f: (q: Query) => Query): Query {
  return transformQuery(query, {
    pipeline(query) {
      return mapQueryPipeline(query, f);
    },
    select(query) {
      let select = {};
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          select[k] = mapQuery(query.select[k], f);
        }
      }
      return f({name: 'select', ...query, select});
    },
    define(query) {
      let binding = {
        name: query.binding.name,
        query: mapQueryPipeline(query.binding.query, f),
      };
      return f({name: 'define', ...query, binding});
    },
    filter(query) {
      return {
        name: 'filter',
        ...f(query),
      };
    },
    otherwise(query) {
      return f(query);
    },
  });
}

export function mapQueryWithTransform<A, B, C>(
  query: Query,
  transform: TransformQuery<A, B, C, Query>,
  a: A, b: B, c: C
): Query {
  return mapQuery(query, query => transformQuery(query, transform, a, b, c));
}

export function mapExpression(
  query: Expression,
  f: (q: Expression) => Expression
): Expression {
  return transformExpression(query, {
    unary(expression) {
      return f({
        name: 'unary',
        op: expression.op,
        expression: mapExpression(expression.expression, f),
        context: expression.context,
      });
    },
    binary(expression) {
      return f({
        name: 'binary',
        op: expression.op,
        left: mapExpression(expression.left, f),
        right: mapExpression(expression.right, f),
        context: expression.context,
      });
    },
    logicalBinary(expression) {
      return f({
        name: 'logicalBinary',
        op: expression.op,
        expressions: expression.expressions
          .map(expression => mapExpression(expression, f)),
        context: expression.context,
      });
    },
    value(expression) {
      return f(expression);
    },
    navigate(expression) {
      return f(expression);
    },
  });
}

export function mapExpressionWithTransform<A, B, C>(
  expression: Expression,
  transform: TransformExpression<A, B, C, Expression>,
  a: A, b: B, c: C
): Expression {
  return mapExpression(
    expression,
    expression => transformExpression(expression, transform, a, b, c)
  );
}

/**
 * Resolve path in the current context.
 */
export function resolvePath(context: Context, path: Array<string>): t.Type {
  let query = select({
    __a__: pipeline(...path.map(item => navigate(item)))
  });
  let type = inferQueryType(context, query).context.type;
  invariant(
    type.name === 'record',
    'Impossible'
  );
  let attribute = t.recordAttribute(type);
  invariant(
    attribute.__a__ != null,
    'Impossible'
  );
  return attribute.__a__.type;
}
