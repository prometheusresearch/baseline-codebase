/**
 * This module implements query model.
 *
 * @flow
 */

import invariant from 'invariant';
import * as t from './Type';

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

/**
 * Query.
 *
 * Ctx parameters represents context which is null by default.
 */
export type Query
  = NavigateQuery
  | SelectQuery
  | DefineQuery
  | FilterQuery
  | LimitQuery
  | AggregateQuery
  | QueryPipeline;

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

const emptyScope: Scope = {};
const emptyDomain: Domain = {entity: {}, aggregate: {}};
const emptyContext = {
  inputType: null,
  type: null,
  scope: emptyScope,
  domain: emptyDomain,
  domainEntity: null,
  domainEntityAttrtibute: null,
};

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

function withContext<Q: Query>(query: Q, context: Context): Q {
  if (query.name === 'pipeline') {
    return {...query, name: 'pipeline', context};
  } else if (query.name === 'select') {
    return {...query, name: 'select', context};
  } else if (query.name === 'define') {
    return {...query, name: 'define', context};
  } else if (query.name === 'filter') {
    return {...query, name: 'filter', context};
  } else if (query.name === 'limit') {
    return {...query, name: 'limit', context};
  } else if (query.name === 'aggregate') {
    return {...query, name: 'aggregate', context};
  } else if (query.name === 'navigate') {
    return {...query, name: 'navigate', context};
  } else {
    invariant(false, 'Unknown query type: %s', query.name);
  }
}

export function inferTypeStep(context: Context, query: Query): Query {
  let {domain, domainEntity, domainEntityAttrtibute, type, scope} = context;
  if (query.name === 'pipeline') {
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
    let predicate = inferTypeStep(context, query.predicate);
    return {name: 'filter', predicate, context};
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
    let baseType = t.atom(type);
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

export function map<A: Query, B: Query>(query: A, f: (q: A) => B): B {
  if (query.name === 'pipeline') {
    let pipeline = query.pipeline.map(q => map(q, f));
    return {name: 'pipeline', ...f(query), pipeline};
  } else if (query.name === 'select') {
    let select = {};
    for (let k in query.select) {
      select[k] = map(query.select[k], f);
    }
    return {name: 'select', ...f(query), select};
  } else if (query.name === 'define') {
    let binding = {
      name: query.binding.name,
      query: map(query.binding.query, f),
    };
    return {name: 'define', ...f(query), binding};
  } else if (query.name === 'filter') {
    return {
      name: 'filter',
      predicate: map(query.predicate, f),
      ...f(query),
    };
  } else if (query.name === 'limit') {
    return f(query);
  } else if (query.name === 'aggregate') {
    return f(query);
  } else if (query.name === 'navigate') {
    return f(query);
  } else {
    invariant(false, 'Unknown query type: %s', query.name);
  }
}

export function getNavigationBefore(context: Context) {
  return getNavigation(context, context.inputType);
}

export function getNavigationAfter(context: Context) {
  return getNavigation(context, context.type);
}

function getNavigation(context, type) {
  let {scope, domain} = context;
  let navigation = [];

  // Collect paths from an input type
  if (type != null) {
    let baseType = t.atom(type);
    if (baseType.name === 'void') {
      for (let k in domain.entity) {
        if (domain.entity.hasOwnProperty(k)) {
          navigation.push({
            value: k,
            label: domain.entity[k].title,
            type: t.leastUpperBound(type, t.entityType(k)),
          });
        }
      }
    } else if (baseType.name === 'entity') {
      let attribute = domain.entity[baseType.entity].attribute;
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          navigation.push({
            value: k,
            label: attribute[k].title,
            type: attribute[k].type,
          });
        }
      }
    }
  }

  // Collect paths from scope
  let contextAtQuery = {...context, type: context.type ? t.atom(context.type) : null};
  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      let type = inferTypeStep(contextAtQuery, scope[k]).context.type;
      navigation.push({
        value: k,
        label: k,
        type: type,
      });
    }
  }

  return navigation;
}
