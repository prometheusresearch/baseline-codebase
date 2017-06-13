/**
 * This module implements query model.
 *
 * @flow
 */

import type {
  Domain,
  Type,
  Context,
  Scope,
  Query,
  QueryAtom,
  QueryPipeline,
  NavigateQuery,
  LimitQuery,
  AggregateQuery,
  HereQuery,
  FilterQuery,
  SelectQuery,
  DefineQuery,
  GroupQuery,
  Expression,
  ConstantExpression,
  BinaryExpression,
  LogicalBinaryExpression,
  UnaryExpression,
} from './types';

import uniqueId from 'lodash/uniqueId';
import invariant from 'invariant';
import * as d from './Domain';
import * as t from './Type';

export const QueryNameSet = new Set([
  'here',
  'navigate',
  'select',
  'define',
  'filter',
  'limit',
  'group',
  'aggregate',
  'pipeline',
]);

function genQueryId() {
  return uniqueId('query');
}

export const emptyScope: Scope = {};
export const emptyContext = {
  prev: ((null: any): Context),
  type: t.voidType(d.emptyDomain),
  hasInvalidType: false,
  scope: emptyScope,
  domain: d.emptyDomain,
  title: null,
};

emptyContext.prev = emptyContext;

export const here = {
  id: genQueryId(),
  name: 'here',
  context: emptyContext,
  savedSelect: null,
};

export function value(value: number | string | boolean): ConstantExpression {
  return {name: 'value', id: genQueryId(), value, context: emptyContext};
}

export function navigate(path: string): NavigateQuery {
  return {
    name: 'navigate',
    id: genQueryId(),
    path,
    context: emptyContext,
    regular: false,
    savedSelect: null,
  };
}

export function use(path: string): NavigateQuery {
  return {
    name: 'navigate',
    id: genQueryId(),
    path,
    context: emptyContext,
    regular: true,
    savedSelect: null,
  };
}

export function filter(predicate: Expression): FilterQuery {
  return {
    name: 'filter',
    id: genQueryId(),
    predicate,
    context: emptyContext,
    savedSelect: null,
  };
}

export function select(select: {[fieldName: string]: QueryPipeline}): SelectQuery {
  return {
    name: 'select',
    id: genQueryId(),
    select,
    context: emptyContext,
    savedSelect: null,
    sort: null,
  };
}

export function def(name: string, query: QueryPipeline): DefineQuery {
  return {
    name: 'define',
    id: genQueryId(),
    binding: {name, query},
    context: emptyContext,
    savedSelect: null,
  };
}

export function limit(limit: number): LimitQuery {
  return {
    name: 'limit',
    id: genQueryId(),
    limit,
    context: emptyContext,
    savedSelect: null,
  };
}

export function aggregate(aggregate: string, path?: ?string = null): AggregateQuery {
  return {
    name: 'aggregate',
    id: genQueryId(),
    aggregate,
    path,
    context: emptyContext,
    savedSelect: null,
  };
}

export function group(byPath: Array<string>): GroupQuery {
  return {
    name: 'group',
    id: genQueryId(),
    byPath,
    context: emptyContext,
    savedSelect: null,
  };
}

export function pipeline(...pipeline: Array<QueryAtom>): QueryPipeline {
  return {name: 'pipeline', id: genQueryId(), pipeline, context: emptyContext};
}

export function and(...expressions: Array<Expression>): LogicalBinaryExpression {
  return {
    name: 'logicalBinary',
    id: genQueryId(),
    op: 'and',
    expressions,
    context: emptyContext,
  };
}

export function or(...expressions: Array<Expression>): LogicalBinaryExpression {
  return {
    name: 'logicalBinary',
    id: genQueryId(),
    op: 'or',
    expressions,
    context: emptyContext,
  };
}

export function not(expression: Expression): UnaryExpression {
  return {name: 'unary', id: genQueryId(), op: 'not', expression, context: emptyContext};
}

export function equal(left: Expression, right: Expression): BinaryExpression {
  return {
    name: 'binary',
    id: genQueryId(),
    op: 'equal',
    left,
    right,
    context: emptyContext,
  };
}

export function notEqual(left: Expression, right: Expression): BinaryExpression {
  return {
    name: 'binary',
    id: genQueryId(),
    op: 'notEqual',
    left,
    right,
    context: emptyContext,
  };
}

export function less(left: Expression, right: Expression): BinaryExpression {
  return {
    name: 'binary',
    id: genQueryId(),
    op: 'less',
    left,
    right,
    context: emptyContext,
  };
}

export function lessEqual(left: Expression, right: Expression): BinaryExpression {
  return {
    name: 'binary',
    id: genQueryId(),
    op: 'lessEqual',
    left,
    right,
    context: emptyContext,
  };
}

export function greater(left: Expression, right: Expression): BinaryExpression {
  return {
    name: 'binary',
    id: genQueryId(),
    op: 'greater',
    left,
    right,
    context: emptyContext,
  };
}

export function greaterEqual(left: Expression, right: Expression): BinaryExpression {
  return {
    name: 'binary',
    id: genQueryId(),
    op: 'greaterEqual',
    left,
    right,
    context: emptyContext,
  };
}

export function contains(left: Expression, right: Expression): BinaryExpression {
  return {
    name: 'binary',
    id: genQueryId(),
    op: 'contains',
    left,
    right,
    context: emptyContext,
  };
}

export function exists(expression: Expression): UnaryExpression {
  return {
    name: 'unary',
    id: genQueryId(),
    op: 'exists',
    expression,
    context: emptyContext,
  };
}

function withContext<Q: Query>(query: Q, context: Context): Q {
  let nextQuery: any = {...query, context};
  return (nextQuery: Q);
}

function withType(context: Context, type: Type): Context {
  let nextContext: any = {...context, type};
  return (nextContext: Context);
}

function withHasInvalidType(context: Context): Context {
  let nextContext: any = {...context, hasInvalidType: true};
  return (nextContext: Context);
}

export function regularizeContext(context: Context): Context {
  let type = t.regType(context.type);
  let nextContext: any = {...context, type};
  return nextContext;
}

export function inferExpressionType(context: Context, query: Expression): Expression {
  if (query.name === 'logicalBinary') {
    let expressions = query.expressions.map(expression =>
      inferExpressionType(context, expression),
    );
    if (expressions.some(expression => expression.context.hasInvalidType)) {
      context = withHasInvalidType(context);
    }
    return {
      id: query.id,
      name: 'logicalBinary',
      op: query.op,
      expressions,
      context: withType(context, t.booleanType(context.domain)),
    };
  } else if (query.name === 'unary') {
    let expression = inferExpressionType(context, query.expression);
    if (expression.context.hasInvalidType) {
      context = withHasInvalidType(context);
    }
    return {
      id: query.id,
      name: 'unary',
      op: query.op,
      expression,
      context: withType(context, t.booleanType(context.domain)),
    };
  } else if (query.name === 'value') {
    let type = t.textType(context.domain);
    if (typeof query.value === 'boolean') {
      type = t.booleanType(context.domain);
    } else if (typeof query.value === 'number') {
      type = t.numberType(context.domain);
    }
    return {
      id: query.id,
      name: 'value',
      value: query.value,
      context: withType(context, type),
    };
  } else if (query.name === 'binary') {
    let left = inferExpressionType(context, query.left);
    let right = inferExpressionType(context, query.right);
    if (left.context.hasInvalidType || right.context.hasInvalidType) {
      context = withHasInvalidType(context);
    }
    return {
      id: query.id,
      name: 'binary',
      op: query.op,
      left,
      right,
      context: withType(context, t.booleanType(context.domain)),
    };
  } else if (query.name === 'navigate') {
    return inferQueryType(context, query);
  } else {
    invariant(false, 'Unknown query type: %s', query.name);
  }
}

export function inferQueryType<Q: Query>(context: Context, query: Q): Q {
  let {domain, type, scope} = context;
  const invalidContext = {
    prev: context,
    domain,
    scope,
    type: t.invalidType(domain),
    hasInvalidType: true,
    title: null,
  };
  let nextQuery: Query = transformQuery(query, {
    here: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      } else {
        return {
          id: genQueryId(),
          name: 'here',
          savedSelect: query.savedSelect,
          context: {
            domain: context.domain,
            scope: context.scope,
            prev: context,
            type,
            title: 'Here',
            hasInvalidType: false,
          },
        };
      }
    },
    pipeline: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let nextPipeline = [];
      let hasInvalidType = false;
      let nextContext = query.pipeline.reduce((context, query) => {
        let q = inferQueryType(context, query);
        nextPipeline.push(q);
        hasInvalidType = hasInvalidType || q.context.hasInvalidType;
        return q.context;
      }, context);
      return {
        id: query.id,
        name: 'pipeline',
        pipeline: nextPipeline,
        context: {
          prev: context,
          domain: nextContext.domain,
          scope: nextContext.scope,
          type: nextContext.type,
          hasInvalidType,
          title: genQueryNameFromPipeline(nextPipeline),
        },
      };
    },
    filter: query => {
      let expressionTitle = genExpressionName(query.predicate);
      let predicate = inferExpressionType(context, query.predicate);
      return {
        id: query.id,
        name: 'filter',
        predicate,
        savedSelect: query.savedSelect,
        context: {
          prev: context,
          scope: context.scope,
          domain: context.domain,
          type: predicate.context.type.name === 'invalid'
            ? t.invalidType(domain)
            : context.type,
          hasInvalidType: predicate.context.hasInvalidType,
          title: expressionTitle == null ? 'Filter' : `Filter by ${expressionTitle}`,
        },
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
      let hasInvalidType = false;
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          let q = inferQueryType(
            {
              prev: context,
              domain,
              scope,
              type: baseType,
              hasInvalidType: false,
              title: null,
            },
            query.select[k],
          );
          nextSelect[k] = q;
          attribute[k] = {
            type: q.context.type,
            title: q.context.title || k,
          };
          hasInvalidType = hasInvalidType || q.context.hasInvalidType;
        }
      }
      return {
        id: query.id,
        name: 'select',
        select: nextSelect,
        savedSelect: query.savedSelect,
        sort: query.sort,
        context: {
          prev: context,
          domain,
          scope,
          type: t.leastUpperBound(type, t.recordType(domain, attribute)),
          hasInvalidType,
          title: null,
        },
      };
    },
    define: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let pipeline = inferQueryType(
        {
          prev: context.prev,
          domain,
          scope,
          type: t.regType(context.type),
          hasInvalidType: false,
          title: null,
        },
        query.binding.query,
      );
      let nextScope = {
        ...scope,
        [query.binding.name]: {
          name: query.binding.name,
          query: pipeline,
        },
      };
      let binding = {
        name: query.binding.name,
        query: ((pipeline: any): QueryPipeline),
      };
      return {
        id: query.id,
        name: 'define',
        savedSelect: query.savedSelect,
        binding,
        context: {
          prev: context,
          domain,
          scope: nextScope,
          type,
          hasInvalidType: binding.query.context.hasInvalidType,
          title: genQueryName(binding.query),
        },
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

      let title = aggregate.title;

      if (query.path != null) {
        const path = query.path;
        const contextAfterNavigate = inferQueryType(context, navigate(path)).context;
        domain = contextAfterNavigate.domain;
        scope = contextAfterNavigate.scope;
        type = contextAfterNavigate.type;
        title = `${uppercase(contextAfterNavigate.title || path)} ${uppercase(title)}`;
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
        hasInvalidType: false,
        title,
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
          id: query.id,
          name: 'group',
          savedSelect: query.savedSelect,
          byPath: [],
          context: {
            prev: context,
            scope,
            domain,
            type: context.type,
            hasInvalidType: false,
            title: 'Group',
          },
        };
      }

      let baseTypeAttribute = t.recordLikeAttribute(baseType);

      let attribute = {};
      let byPathTitleList = [];
      for (let i = 0; i < query.byPath.length; i++) {
        let k = query.byPath[i];
        if (baseTypeAttribute[k] != null) {
          attribute[k] = {
            type: baseTypeAttribute[k].type,
            groupBy: true,
          };
          byPathTitleList.push(baseTypeAttribute[k].title || k);
        } else if (scope[k] != null) {
          attribute[k] = {
            type: scope[k].query.context.type,
            groupBy: true,
          };
          byPathTitleList.push(scope[k].query.context.title || k);
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
        hasInvalidType: false,
        title: `Group by ${byPathTitleList.join(', ')}`,
      });
    },
    navigate: query => {
      if (type.name === 'invalid') {
        return withContext(query, context);
      }
      let baseType = t.regType(type);
      if (t.isRecordLike(baseType)) {
        let field = t.recordLikeAttribute(baseType)[query.path];
        if (field != null) {
          return withContext(query, {
            prev: context,
            domain,
            scope: {},
            type: t.leastUpperBound(type, field.type),
            hasInvalidType: false,
            title: field.title,
          });
        }
        let definition = scope[query.path];
        if (definition != null) {
          let definitionQuery = definition.query;
          if (query.regular) {
            definitionQuery = regularizePipeline(definitionQuery);
          }
          return withContext(query, {
            prev: context,
            domain,
            scope: {},
            type: t.leastUpperBound(
              type,
              inferQueryType(context, definitionQuery).context.type,
            ),
            hasInvalidType: false,
            title: definition.query.context.title,
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
            hasInvalidType: false,
            title: entity.title,
          });
        }
        let definition = scope[query.path];
        if (definition != null) {
          return withContext(query, {
            prev: context,
            domain,
            scope,
            type: inferQueryType(context, definition.query).context.type,
            hasInvalidType: false,
            title: definition.query.context.title,
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

export function voidContext(domain: Domain): Context {
  let context = {
    prev: emptyContext,
    domain,
    type: t.voidType(domain),
    hasInvalidType: false,
    scope: {},
    title: null,
  };
  return context;
}

/**
 * Infer the type of the query in context of a domain.
 */
export function inferType<Q: Query>(domain: Domain, query: Q): Q {
  return inferQueryType(voidContext(domain), query);
}

function regularizePipeline(query: QueryPipeline): QueryPipeline {
  let last = query.pipeline[query.pipeline.length - 1];
  if (last && last.name === 'select') {
    query = {
      id: query.id,
      name: 'pipeline',
      pipeline: query.pipeline.slice(0, query.pipeline.length - 1),
      context: last.context.prev,
    };
  }
  return query;
}

type TransformQuery<A, B, C, R = Query> = {
  pipeline?: (query: QueryPipeline, a: A, b: B, c: C) => R,
  aggregate?: (query: AggregateQuery, a: A, b: B, c: C) => R,
  group?: (query: GroupQuery, a: A, b: B, c: C) => R,
  limit?: (query: LimitQuery, a: A, b: B, c: C) => R,
  here?: (query: HereQuery, a: A, b: B, c: C) => R,
  select?: (query: SelectQuery, a: A, b: B, c: C) => R,
  filter?: (query: FilterQuery, a: A, b: B, c: C) => R,
  define?: (query: DefineQuery, a: A, b: B, c: C) => R,
  navigate?: (query: NavigateQuery, a: A, b: B, c: C) => R,
  otherwise?: (query: Query, a: A, b: B, c: C) => R,
};

type TransformExpression<A, B, C, R = Expression> = {
  binary?: (query: BinaryExpression, a: A, b: B, c: C) => R,
  unary?: (query: UnaryExpression, a: A, b: B, c: C) => R,
  logicalBinary?: (query: LogicalBinaryExpression, a: A, b: B, c: C) => R,
  value?: (query: ConstantExpression, a: A, b: B, c: C) => R,
  navigate?: (query: NavigateQuery, a: A, b: B, c: C) => R,
  otherwise?: (query: Expression, a: A, b: B, c: C) => R,
};

function fail<R>(query: Query | Expression, _a, _b, _c): R {
  invariant(false, 'Do not know how to process: %s', query.name);
}

export function transformQuery<A, B, C, R>(
  query: Query,
  transform: TransformQuery<A, B, C, R>,
  a: A,
  b: B,
  c: C,
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
      return transform.here ? transform.here(query, a, b, c) : otherwise(query, a, b, c);
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
  a: A,
  b: B,
  c: C,
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

function mapQueryPipeline(query: QueryPipeline, f: (q: Query) => Query): QueryPipeline {
  let pipeline = query.pipeline.map(q => {
    let nextQ = mapQuery(q, f);
    invariant(nextQ.name !== 'pipeline', 'Invalid query structure');
    return nextQ;
  });
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
  a: A,
  b: B,
  c: C,
): Query {
  return mapQuery(query, query => transformQuery(query, transform, a, b, c));
}

export function mapExpression(
  query: Expression,
  f: (q: Expression) => Expression,
): Expression {
  return transformExpression(query, {
    unary(expression) {
      return f({
        id: expression.id,
        name: 'unary',
        op: expression.op,
        expression: mapExpression(expression.expression, f),
        context: expression.context,
      });
    },
    binary(expression) {
      return f({
        id: expression.id,
        name: 'binary',
        op: expression.op,
        left: mapExpression(expression.left, f),
        right: mapExpression(expression.right, f),
        context: expression.context,
      });
    },
    logicalBinary(expression) {
      return f({
        id: expression.id,
        name: 'logicalBinary',
        op: expression.op,
        expressions: expression.expressions.map(expression =>
          mapExpression(expression, f),
        ),
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
  a: A,
  b: B,
  c: C,
): Expression {
  return mapExpression(expression, expression =>
    transformExpression(expression, transform, a, b, c),
  );
}

/**
 * Resolve path in the current context.
 */
export function inferTypeAtPath(context: Context, path: Array<string>): Type {
  let query = pipeline(...path.map(item => navigate(item)));
  return inferQueryType(regularizeContext(context), query).context.type;
}

export function genQueryName(query: Query): ?string {
  if (query.name === 'pipeline') {
    return genQueryNameFromPipeline(query.pipeline);
  } else {
    return genQueryNameFromPipeline([query]);
  }
}

export function genQueryNameFromPipeline(pipeline: Array<QueryAtom>): ?string {
  let name = [];
  for (let i = 0; i < pipeline.length; i++) {
    let q = pipeline[i];
    if (q.name === 'navigate') {
      name.push(uppercase(q.context.title || q.path));
    } else if (q.name === 'aggregate') {
      if (q.path != null) {
        name.push(q.context.title || `${uppercase(q.path)} ${q.aggregate}`);
      } else {
        name.push(q.context.title || uppercase(q.aggregate));
      }
    }
  }
  return name.length > 0 ? name.join(' ') : null;
}

function uppercase(string) {
  return string[0].toUpperCase() + string.slice(1);
}

export function deserializeQuery(data: string): Query {
  let queryWithoutContext: Query = (JSON.parse(data): any);
  return sanitizeQuery(queryWithoutContext, _ctx => emptyContext);
}

export function serializeQuery(query: Query): string {
  let queryWithoutContext = sanitizeQuery(query, _ctx => null);
  return JSON.stringify(queryWithoutContext);
}

function sanitizeQuery(query: Query, modifyContext: (ctx: ?Context) => ?Context): Query {
  let nextQuery: Query = (mapQueryWithTransform(query, {
    filter(query) {
      return ({
        ...query,
        name: 'filter',
        predicate: sanitizeExpression(query.predicate, modifyContext),
        context: modifyContext(query.context),
        savedSelect: null,
      }: any);
    },
    otherwise(query) {
      return ({
        ...query,
        context: modifyContext(query.context),
        savedSelect: null,
      }: any);
    },
  }): any);
  return nextQuery;
}

function sanitizeExpression(
  expression: Expression,
  modifyContext: (ctx: ?Context) => ?Context,
): Expression {
  let nextExpression: Expression = (mapExpressionWithTransform(expression, {
    otherwise(expression) {
      return ({
        ...expression,
        context: modifyContext(expression.context),
      }: any);
    },
  }): any);
  return nextExpression;
}

export function genExpressionName(expression: Expression): ?string {
  if (expression.name === 'logicalBinary' && expression.op === 'or') {
    let fields = [];
    expression.expressions.forEach(expr => {
      if (!(expr.name === 'value' && expr.value === true) && expr.name === 'binary') {
        if (expr.left.name === 'navigate') {
          let title = expr.left.context.title || expr.left.path;
          if (!fields.includes(title)) {
            fields.push(title);
          }
        }
      }
    });

    if (fields.length) {
      return fields.join(', ');
    }
  }
  return null;
}
