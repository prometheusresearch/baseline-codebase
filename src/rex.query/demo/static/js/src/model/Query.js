/**
 * This module implements query model.
 *
 * @flow
 */

/* eslint-disable no-use-before-define */

import invariant from 'invariant';
import * as t from './Type';

export type HereQuery = {
  name: 'here';
  context: Context;
};

export type ValueQuery = {
  name: 'value';
  value: string | number | boolean | null;
  context: Context;
};

export type NavigateQuery = {
  name: 'navigate';
  path: string;
  context: Context;
};

export type SelectQuery = {
  name: 'select';
  select: {[name: string]: QueryPipeline};
  context: Context;
};

type DefineQueryBinding = {
  name: string;
  query: QueryPipeline;
};

export type DefineQuery = {
  name: 'define';
  binding: DefineQueryBinding;
  context: Context;
};

export type FilterQuery = {
  name: 'filter';
  predicate: Expression;
  context: Context;
};

export type LimitQuery = {
  name: 'limit';
  limit: number;
  context: Context;
};

export type AggregateQuery = {
  name: 'aggregate';
  aggregate: string;
  context: Context;
};

export type QueryPipeline = {
  name: 'pipeline',
  pipeline: Array<Query>;
  context: Context;
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
  name: 'binary';
  op: BinaryOperator;
  left: Expression;
  right: Expression;
  context: Context;
};

export type UnaryOperator
  = 'not'
  | 'exists';

export type UnaryQuery = {
  name: 'unary';
  op: UnaryOperator;
  expression: Expression;
  context: Context;
};

export type LogicalBinaryOperator
  = 'and'
  | 'or';

export type LogicalBinaryQuery = {
  name: 'logicalBinary';
  op: LogicalBinaryOperator;
  expressions: Array<Expression>;
  context: Context;
};


/**
 * Describe query structure.
 */
export type Query
  = HereQuery
  | NavigateQuery
  | SelectQuery
  | DefineQuery
  | FilterQuery
  | LimitQuery
  | AggregateQuery
  | QueryPipeline;


/**
 * Describe expression which are used in filter query.
 */
export type Expression
  = ValueQuery
  | NavigateQuery
  | BinaryQuery
  | UnaryQuery
  | LogicalBinaryQuery
  | {name: 'query'; query: Query; context: Context};

/**
 * Domain represents data schema.
 *
 * TODO: this is incomplete, needs to be extended.
 */
export type Domain = {

  // Aggregate catalogue.
  aggregate: {
    [aggregateName: string]: {
      makeType: (typ: t.Type) => t.Type;
    }
  };

  // Entity catalogue (tables).
  entity: {
    [entityName: string]: DomainEntity;
  };
};

export type DomainEntity = {
  title: string;
  attribute: {
    [attributeName: string]: DomainEntityAttribute;
  };
};

export type DomainEntityAttribute = {
  title: string;
  type: t.Type
};

/**
 * Set of queries in scope (by key).
 *
 * Usually those introduced by .define(name := ...) combinator.
 */
export type Scope = {
  [name: string]: QueryPipeline;
};

/**
 * Query context represents knowledge about query at any given point.
 */
export type Context = {
  prev: Context;

  // domain
  domain: Domain;

  domainEntity: ?DomainEntity;

  domainEntityAttrtibute: ?DomainEntityAttribute;

  // scope which query can reference other queries from
  scope: Scope;

  // output type of the query
  inputType: ?t.Type;

  // output type of the query
  type: ?t.Type;
};

export const emptyScope: Scope = {};
export const emptyDomain: Domain = {entity: {}, aggregate: {}};
export const emptyContext = {
  prev: ((null: any): Context),
  inputType: null,
  type: null,
  scope: emptyScope,
  domain: emptyDomain,
  domainEntity: null,
  domainEntityAttrtibute: null,
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
  return transformQuery(query, {
    otherwise(query) {
      return (({...query, context}: any): Q);
    }
  });
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
  const {domain, domainEntity, domainEntityAttrtibute, type, scope} = context;
  let nextQuery = transformQuery(query, {
    here: query => {
      if (type == null) {
        return withContext(query, context);
      } else {
        return {
          name: 'here',
          context: {
            ...context,
            prev: context,
            type,
            inputType: type
          },
        };
      }
    },
    pipeline: query => {
      if (type == null) {
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
          inputType: type
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
      if (type == null) {
        return withContext(query, context);
      }
      let baseType = t.atom(type);
      let nextSelect = {};
      let fields = {};
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          let q = inferQueryType({
            prev: context,
            domain,
            domainEntity,
            domainEntityAttrtibute,
            scope,
            inputType: context.type,
            type: baseType,
          }, query.select[k]);
          nextSelect[k] = q;
          fields[k] = q.context.type;
        }
      }
      return {
        name: 'select',
        select: nextSelect,
        context: {
          prev: context,
          domain,
          domainEntity: null,
          domainEntityAttrtibute: null,
          scope,
          inputType: context.type,
          type: t.leastUpperBound(type, {name: 'record', fields}),
        }
      };
    },
    define: query => {
      if (type == null) {
        return withContext(query, context);
      }
      let nextScope = {
        ...scope,
        [query.binding.name]: inferQueryType(context, query.binding.query),
      };
      let pipeline = inferQueryType(context, query.binding.query);
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
          domainEntity,
          domainEntityAttrtibute,
          scope: nextScope,
          inputType: context.type,
          type,
        }
      };
    },
    aggregate: query => {
      if (type == null) {
        return withContext(query, context);
      }
      let aggregate = domain.aggregate[query.aggregate];
      if (aggregate == null) {
        // unknown aggregate
        return withContext(query, {
          prev: context,
          domain,
          domainEntity: null,
          domainEntityAttrtibute: null,
          scope,
          inputType: context.type,
          type: null,
        });
      }
      // TODO: validate input type
      if (type.name !== 'seq') {
        // not a seq
        return withContext(query, {
          prev: context,
          domain,
          domainEntity: null,
          domainEntityAttrtibute: null,
          scope,
          inputType: context.type,
          type: null,
        });
      }
      return withContext(query, {
        prev: context,
        domain,
        domainEntity: null,
        domainEntityAttrtibute: null,
        scope: {},
        inputType: context.type,
        type: aggregate.makeType(type.type),
      });

    },
    navigate: query => {
      if (type == null) {
        return withContext(query, context);
      }
      let baseType = t.atom(type);
      if (baseType.name === 'entity') {
        let entity = domain.entity[baseType.entity];
        if (entity == null) {
          // unknown entity
          return withContext(query, {
            prev: context,
            domain,
            domainEntity: null,
            domainEntityAttrtibute: null,
            scope,
            inputType: context.type,
            type: null,
          });
        }
        let attr = entity.attribute[query.path];
        if (attr != null) {
          return withContext(query, {
            prev: context,
            domain,
            domainEntity,
            domainEntityAttrtibute: attr,
            scope: {},
            inputType: context.type,
            type: t.leastUpperBound(type, attr.type),
          });
        }
        let definition = scope[query.path];
        if (definition != null) {
          return withContext(query, {
            prev: context,
            domain,
            domainEntity: getDomainEntityFromDefinition(domain, query.path, definition),
            domainEntityAttrtibute: getDomainEntityAttributeFromDefinition(domain, domainEntity, query.path, definition),
            scope: {},
            inputType: context.type,
            type: inferQueryType(context, definition).context.type,
          });
        }
        // unknown attribute
        return withContext(query, {
          prev: context,
          domain,
          domainEntity: null,
          domainEntityAttrtibute: null,
          scope,
          inputType: context.type,
          type: null,
        });
      } else if (baseType.name === 'record') {
        let field = baseType.fields[query.path];
        if (field != null) {
          return withContext(query, {
            prev: context,
            domain,
            domainEntity: null,
            domainEntityAttrtibute: null,
            scope,
            inputType: context.type,
            type: t.leastUpperBound(type, field),
          });
        }
        let definition = scope[query.path];
        if (definition != null) {
          return withContext(query, {
            prev: context,
            domain,
            domainEntity: getDomainEntityFromDefinition(domain, query.path, definition),
            domainEntityAttrtibute: getDomainEntityAttributeFromDefinition(domain, domainEntity, query.path, definition),
            scope,
            inputType: context.type,
            type: inferQueryType(context, definition).context.type,
          });
        }
        // unknown field
        return withContext(query, {
          prev: context,
          domain,
          domainEntity: null,
          domainEntityAttrtibute: null,
          scope,
          inputType: context.type,
          type: null,
        });
      } else if (baseType.name === 'void') {
        let entity = domain.entity[query.path];
        if (entity != null) {
          return withContext(query, {
            prev: context,
            domain,
            domainEntity: entity,
            domainEntityAttrtibute: null,
            scope,
            inputType: context.type,
            type: t.seqType(t.entityType(query.path)),
          });
        }
        let definition = scope[query.path];
        if (definition != null) {
          return withContext(query, {
            prev: context,
            domain,
            domainEntity: getDomainEntityFromDefinition(domain, query.path, definition),
            domainEntityAttrtibute: getDomainEntityAttributeFromDefinition(domain, domainEntity, query.path, definition),
            scope,
            inputType: context.type,
            type: inferQueryType(context, definition).context.type,
          });
        }
        // unknown entity
        return withContext(query, {
          prev: context,
          domain,
          domainEntity: null,
          domainEntityAttrtibute: null,
          scope,
          inputType: context.type,
          type: null,
        });
      } else {
        // can't navigate from this type
        return withContext(query, {
          prev: context,
          domain,
          domainEntity: null,
          domainEntityAttrtibute: null,
          scope,
          inputType: context.type,
          type: null,
        });
      }
    },
  });
  return ((nextQuery: any): Q);
}

function getDomainEntityFromDefinition(domain, name, query): ?DomainEntity {
  if (query.context.type == null) {
    return null;
  }
  let baseType = t.atom(query.context.type);
  if (baseType.name !== 'entity') {
    return null;
  }
  let entity = domain[baseType.entity];
  return entity;
}

function getDomainEntityAttributeFromDefinition(domain, domainEntity, name, query): ?DomainEntityAttribute {
  if (domainEntity == null) {
    return null;
  }
  if (query.context.type == null) {
    return null;
  }
  let baseType = t.atom(query.context.type);
  if (baseType.name === 'entity') {
    return null;
  }
  let attr = domainEntity.attribute[name];
  return attr;
}

/**
 * Infer the type of the query in context of a domain.
 */
export function inferType<Q: Query>(domain: Domain, query: Q): Q {
  let context = {
    prev: emptyContext,
    domain,
    domainEntity: null,
    domainEntityAttrtibute: null,
    inputType: t.voidType,
    type: t.voidType,
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
      return {name: 'select', ...f(query), select};
    },
    define(query) {
      let binding = {
        name: query.binding.name,
        query: mapQueryPipeline(query.binding.query, f),
      };
      return {name: 'define', ...f(query), binding};
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

/**
 * Resolve name in the current context.
 */
export function resolveName(context: Context, name: string): ?t.Type {
  let {scope, domain, type} = context;
  if (type != null) {
    type = t.atom(type);
    if (type.name === 'record' && type.fields[name] != null) {
      return type.fields[name];
    }
    if (
      type.name === 'void' &&
      domain.entity[name] != null
    ) {
      return t.entityType(name);
    }
    if (
      type.name === 'entity' &&
      domain.entity[type.entity] != null &&
      domain.entity[type.entity].attribute[name] != null
    ) {
      return domain.entity[type.entity].attribute[name].type;
    }
  }

  if (scope[name] != null) {
    let ctx = inferQueryType(context, scope[name]).context;
    return ctx.type;
  }

  return undefined;
}

/**
 * Resolve path in the current context.
 */
export function resolvePath(context: Context, path: Array<string>): ?t.Type {
  let type = null;
  for (let i = 0; i < path.length; i++) {
    type = resolveName(context, path[i]);
    if (type === undefined) {
      return undefined;
    } else {
      context = {...context, type};
    }
  }
  return type;
}
