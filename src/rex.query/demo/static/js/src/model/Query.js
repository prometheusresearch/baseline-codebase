/**
 * This module implements query model.
 *
 * @flow
 */

/* eslint-disable no-use-before-define */

import invariant from 'invariant';
import isPlainObject from 'lodash/isPlainObject';
import * as t from './Type';

export type HereQuery = {
  name: 'here';
  context: Context;
};

export type NavigateQuery = {
  name: 'navigate';
  path: string;
  context: Context;
};

export type SelectQuery = {
  name: 'select';
  select: {[name: string]: Query};
  context: Context;
};

export type DefineQuery = {
  name: 'define';
  binding: {name: string; query: Query};
  context: Context;
};

export type FilterQuery = {
  name: 'filter';
  predicate: Query;
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

export type AndQuery = {
  name: 'and';
  expressions: Array<QueryOrLiteral>;
  context: Context;
};

export type OrQuery = {
  name: 'or';
  expressions: Array<QueryOrLiteral>;
  context: Context;
};

export type NotQuery = {
  name: 'not';
  expression: QueryOrLiteral;
  context: Context;
};

export type EqualQuery = {
  name: 'equal';
  left: QueryOrLiteral;
  right: QueryOrLiteral;
  context: Context;
};

export type NotEqualQuery = {
  name: 'notEqual';
  left: QueryOrLiteral;
  right: QueryOrLiteral;
  context: Context;
};

export type LessQuery = {
  name: 'less';
  left: QueryOrLiteral;
  right: QueryOrLiteral;
  context: Context;
};

export type LessEqualQuery = {
  name: 'lessEqual';
  left: QueryOrLiteral;
  right: QueryOrLiteral;
  context: Context;
};

export type GreaterQuery = {
  name: 'greater';
  left: QueryOrLiteral;
  right: QueryOrLiteral;
  context: Context;
};

export type GreaterEqualQuery = {
  name: 'greaterEqual';
  left: QueryOrLiteral;
  right: QueryOrLiteral;
  context: Context;
};

export type ContainsQuery = {
  name: 'contains';
  left: QueryOrLiteral;
  right: QueryOrLiteral;
  context: Context;
};

export type ExistsQuery = {
  name: 'exists';
  expression: QueryOrLiteral;
  context: Context;
};


/**
 * Query.
 *
 * Ctx parameters represents context which is null by default.
 */
export type Query
  = HereQuery
  | NavigateQuery
  | SelectQuery
  | DefineQuery
  | FilterQuery
  | LimitQuery
  | AggregateQuery
  | AndQuery | OrQuery | NotQuery
  | EqualQuery | NotEqualQuery | LessQuery | LessEqualQuery | GreaterQuery | GreaterEqualQuery
  | ContainsQuery | ExistsQuery
  | QueryPipeline;

export type QueryOrLiteral = Query | string | number | boolean | Array<string> | Array<number> | null;

export function isQuery(obj: any): boolean {
  return (obj && isPlainObject(obj) && obj.name && obj.context);
}

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
  [name: string]: Query;
};

/**
 * Query context represents knowledge about query at any given point.
 */
export type Context = {
  // link to the domain
  domain: Domain;

  domainEntity: ?DomainEntity;

  domainEntityAttrtibute: ?DomainEntityAttribute;
  // scope which query can reference other queries from
  scope: Scope;
  // output tupe of the query
  inputType: ?t.Type;
  // output tupe of the query
  type: ?t.Type;
};

export const emptyScope: Scope = {};
export const emptyDomain: Domain = {entity: {}, aggregate: {}};
export const emptyContext = {
  inputType: null,
  type: null,
  scope: emptyScope,
  domain: emptyDomain,
  domainEntity: null,
  domainEntityAttrtibute: null,
};

export const here = {name: 'here', context: emptyContext};

export function navigate(path: string): NavigateQuery {
  return {name: 'navigate', path, context: emptyContext};
}

export function filter(predicate: Query): FilterQuery {
  return {name: 'filter', predicate, context: emptyContext};
}

export function select(select: {[fieldName: string]: Query}): SelectQuery {
  return {name: 'select', select, context: emptyContext};
}

export function def(name: string, query: Query): DefineQuery {
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

export function and(...expressions: Array<QueryOrLiteral>): AndQuery {
  return {name: 'and', expressions, context: emptyContext};
}

export function or(...expressions: Array<QueryOrLiteral>): OrQuery {
  return {name: 'or', expressions, context: emptyContext};
}

export function not(expression: QueryOrLiteral): NotQuery {
  return {name: 'not', expression, context: emptyContext};
}

export function equal(left: QueryOrLiteral, right: QueryOrLiteral): EqualQuery {
  return {name: 'equal', left, right, context: emptyContext};
}

export function notEqual(left: QueryOrLiteral, right: QueryOrLiteral): NotEqualQuery {
  return {name: 'notEqual', left, right, context: emptyContext};
}

export function less(left: QueryOrLiteral, right: QueryOrLiteral): LessQuery {
  return {name: 'less', left, right, context: emptyContext};
}

export function lessEqual(left: QueryOrLiteral, right: QueryOrLiteral): LessEqualQuery {
  return {name: 'lessEqual', left, right, context: emptyContext};
}

export function greater(left: QueryOrLiteral, right: QueryOrLiteral): GreaterQuery {
  return {name: 'greater', left, right, context: emptyContext};
}

export function greaterEqual(left: QueryOrLiteral, right: QueryOrLiteral): GreaterEqualQuery {
  return {name: 'greaterEqual', left, right, context: emptyContext};
}

export function contains(left: QueryOrLiteral, right: QueryOrLiteral): ContainsQuery {
  return {name: 'contains', left, right, context: emptyContext};
}

export function exists(expression: QueryOrLiteral): ExistsQuery {
  return {name: 'exists', expression, context: emptyContext};
}


function withContext(query, context: Context) {
  switch (query.name) {
    case 'here':
      return {name: 'here', context};
    case 'pipeline':
      return {name: 'pipeline', context, pipeline: query.pipeline};
    case 'select':
      return {name: 'select', context, select: query.select};
    case 'define':
      return {name: 'define', context, binding: query.binding};
    case 'filter':
      return {name: 'filter', context, predicate: query.predicate};
    case 'limit':
      return {name: 'limit', context, limit: query.limit};
    case 'aggregate':
      return {name: 'aggregate', context, aggregate: query.aggregate};
    case 'navigate':
      return {name: 'navigate', context, path: query.path};
    case 'and':
      return {name: 'and', context, expressions: query.expressions};
    case 'or':
      return {name: 'or', context, expressions: query.expressions};
    case 'not':
      return {name: 'not', context, expression: query.expression};
    case 'equal':
      return {name: 'equal', context, left: query.left, right: query.right};
    case 'notEqual':
      return {name: 'notEqual', context, left: query.left, right: query.right};
    case 'less':
      return {name: 'less', context, left: query.left, right: query.right};
    case 'lessEqual':
      return {name: 'lessEqual', context, left: query.left, right: query.right};
    case 'greater':
      return {name: 'greater', context, left: query.left, right: query.right};
    case 'greaterEqual':
      return {name: 'greaterEqual', context, left: query.left, right: query.right};
    case 'contains':
      return {name: 'contains', context, left: query.left, right: query.right};
    case 'exists':
      return {name: 'exists', context, expression: query.expression};
    default:
      invariant(false, 'Unknown query type: %s', query.name);
  }
}


export function inferTypeStep(context: Context, query: Query): Query {
  let {domain, domainEntity, domainEntityAttrtibute, type, scope} = context;
  let BINARY_COMPARISON_OPS = [
    'equal', 'notEqual',
    'less', 'lessEqual', 'greater', 'greaterEqual',
    'contains',
  ];
  let UNARY_OPS = [
    'not',
    'exists',
  ];

  if (query.name === 'here') {
    if (type == null) {
      return withContext(query, context);
    }
    return {
      name: 'here',
      context: {...context, type, inputType: type},
    };

  } else if (query.name === 'pipeline') {
    if (type == null) {
      return withContext(query, context);
    }
    let nextPipeline = [];
    let nextContext = query.pipeline.reduce(
      (context, query) => {
        let q = inferTypeStep(context, query);
        nextPipeline.push(q);
        return q.context;
      },
      context
    );
    return {
      name: 'pipeline',
      pipeline: nextPipeline,
      context: {...nextContext, inputType: type},
    };

  } else if (query.name === 'filter') {
    let {predicate} = query;
    if (predicate) {
      predicate = inferTypeStep(context, query.predicate);
    }
    return {name: 'filter', predicate, context};

  } else if (['and', 'or'].includes(query.name)) {
    return {
      name: query.name,
      expressions: query.expressions.map((exp) => {
        if (isQuery(exp)) {
          // $ExpectError
          exp = inferTypeStep(context, exp);
        }
        return exp;
      }),
      context,
    };

  } else if (UNARY_OPS.includes(query.name)) {
    return {
      name: query.name,
      // $ExpectError
      expression: inferTypeStep(context, query.expression),
      context,
    };

  } else if (BINARY_COMPARISON_OPS.includes(query.name)) {
    let {left, right} = query;
    // $ExpectError
    if (isQuery(left)) { left = inferTypeStep(context, left); }
    // $ExpectError
    if (isQuery(right)) { right = inferTypeStep(context, right); }
    return {name: query.name, left, right, context};

  } else if (query.name === 'limit') {
    return withContext(query, context);

  } else if (query.name === 'select') {
    if (type == null) {
      return withContext(query, context);
    }
    let baseType = t.atom(type);
    let nextSelect = {};
    let fields = {};
    for (let k in query.select) {
      if (query.select.hasOwnProperty(k)) {
        let q = inferTypeStep({
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
        domain,
        domainEntity: null,
        domainEntityAttrtibute: null,
        scope,
        inputType: context.type,
        type: t.leastUpperBound(type, {name: 'record', fields}),
      }
    };

  } else if (query.name === 'define') {
    if (type == null) {
      return withContext(query, context);
    }
    let nextScope = {
      ...scope,
      [query.binding.name]: inferTypeStep(context, query.binding.query),
    };
    let binding = {
      name: query.binding.name,
      query: inferTypeStep(context, query.binding.query),
    };
    return {
      name: 'define',
      binding,
      context: {
        domain,
        domainEntity,
        domainEntityAttrtibute,
        scope: nextScope,
        inputType: context.type,
        type,
      }
    };

  } else if (query.name === 'aggregate') {
    if (type == null) {
      return withContext(query, context);
    }
    let aggregate = domain.aggregate[query.aggregate];
    if (aggregate == null) {
      // unknown aggregate
      return withContext(query, {
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
        domain,
        domainEntity: null,
        domainEntityAttrtibute: null,
        scope,
        inputType: context.type,
        type: null,
      });
    }
    return withContext(query, {
      domain,
      domainEntity: null,
      domainEntityAttrtibute: null,
      scope: {},
      inputType: context.type,
      type: aggregate.makeType(type.type),
    });

  } else if (query.name === 'navigate') {
    if (type == null) {
      return withContext(query, context);
    }
    let baseType = t.atom(type);
    if (baseType.name === 'entity') {
      let entity = domain.entity[baseType.entity];
      if (entity == null) {
        // unknown entity
        return withContext(query, {
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
          domain,
          domainEntity: getDomainEntityFromDefinition(domain, query.path, definition),
          domainEntityAttrtibute: getDomainEntityAttributeFromDefinition(domain, domainEntity, query.path, definition),
          scope: {},
          inputType: context.type,
          type: inferTypeStep(context, definition).context.type,
        });
      }
      // unknown attribute
      return withContext(query, {
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
          domain,
          domainEntity: getDomainEntityFromDefinition(domain, query.path, definition),
          domainEntityAttrtibute: getDomainEntityAttributeFromDefinition(domain, domainEntity, query.path, definition),
          scope,
          inputType: context.type,
          type: inferTypeStep(context, definition).context.type,
        });
      }
      // unknown field
      return withContext(query, {
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
          domain,
          domainEntity: getDomainEntityFromDefinition(domain, query.path, definition),
          domainEntityAttrtibute: getDomainEntityAttributeFromDefinition(domain, domainEntity, query.path, definition),
          scope,
          inputType: context.type,
          type: inferTypeStep(context, definition).context.type,
        });
      }
      // unknown entity
      return withContext(query, {
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
        domain,
        domainEntity: null,
        domainEntityAttrtibute: null,
        scope,
        inputType: context.type,
        type: null,
      });
    }

  } else {
    invariant(false, 'Unknown query type: %s', query.name);
  }
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
export function inferType(domain: Domain, query: Query): Query {
  let context = {
    domain,
    domainEntity: null,
    domainEntityAttrtibute: null,
    inputType: t.voidType,
    type: t.voidType,
    scope: {}
  };
  return inferTypeStep(context, query);
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

type Transform<A, B, C, R = Query> = {
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


function fail<R>(query: Query): R {
  invariant(false, 'Do not know how to process: %s', query.name);
}

export function transform<A, B, C, R>(
  query: Query,
  transform: Transform<A, B, C, R>,
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

export function map(query: Query, f: (q: Query) => Query): Query {
  return transform(query, {
    pipeline(query) {
      let pipeline = query.pipeline.map(q => map(q, f));
      return {name: 'pipeline', ...f(query), pipeline};
    },
    select(query) {
      let select = {};
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          select[k] = map(query.select[k], f);
        }
      }
      return {name: 'select', ...f(query), select};
    },
    define(query) {
      let binding = {
        name: query.binding.name,
        query: map(query.binding.query, f),
      };
      return {name: 'define', ...f(query), binding};
    },
    filter(query) {
      let predicate = map(query.predicate, f);
      return {
        name: 'filter',
        predicate,
        ...f(query),
      };
    },
    otherwise(query) {
      return f(query);
    },
  });
}

export function mapWithTransform<A, B, C>(
  query: Query,
  transformSpec: Transform<A, B, C>,
  a: A, b: B, c: C
): Query {
  return map(
    query,
    query => transform(query, transformSpec, a, b, c)
  );
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
    let ctx = inferTypeStep(context, scope[name]).context;
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
