/**
 * @flow
 */

/* eslint-disable no-use-before-define */

export type Domain = {
  // Aggregate catalogue.
  aggregate: {
    [aggregateName: string]: DomainAggregate,
  },

  // Entity catalogue (tables).
  entity: {
    [entityName: string]: DomainEntity,
  },
};

export type DomainAggregate = {
  title: string,
  name: string,
  isAllowed: (typ: Type) => boolean,
  makeType: (typ: Type) => Type,
};

export type DomainEntity = {
  title: string,
  attribute: DomainAttributeMap,
};

export type DomainAttribute = {
  title: string,
  type: Type,
  groupBy?: boolean,
};

export type DomainAttributeMap = {
  [name: string]: DomainAttribute,
};

export type Type =
  | VoidType
  | NumberType
  | BooleanType
  | TextType
  | JSONType
  | EnumerationType
  | DateType
  | TimeType
  | DateTimeType
  | InvalidType
  | RecordType;

export type TypeCardinality = 'seq' | 'opt' | null;

type TypeCardinalityProp = {
  card: TypeCardinality,
};

export type InvalidType = {
  name: 'invalid',
  domain: Domain,
  card: null,
};

export type VoidType = {
  name: 'void',
  domain: Domain,
} & TypeCardinalityProp;

export type TextType = {
  name: 'text',
  domain: Domain,
} & TypeCardinalityProp;

export type JSONType = {
  name: 'json',
  domain: Domain,
} & TypeCardinalityProp;

export type NumberType = {
  name: 'number',
  domain: Domain,
} & TypeCardinalityProp;

export type BooleanType = {
  name: 'boolean',
  domain: Domain,
} & TypeCardinalityProp;

export type EnumerationType = {
  name: 'enumeration',
  enumerations: Array<string>,
  domain: Domain,
} & TypeCardinalityProp;

export type DateType = {
  name: 'date',
  domain: Domain,
  attribute: DomainAttributeMap,
} & TypeCardinalityProp;

export type TimeType = {
  name: 'time',
  domain: Domain,
  attribute: DomainAttributeMap,
} & TypeCardinalityProp;

export type DateTimeType = {
  name: 'datetime',
  domain: Domain,
  attribute: DomainAttributeMap,
} & TypeCardinalityProp;

export type RecordType = {
  name: 'record',
  entity: ?string,
  attribute: ?DomainAttributeMap,
  domain: Domain,
} & TypeCardinalityProp;

export type HereQuery = {
  +id: string,
  +name: 'here',
  +context: Context,
  +savedSelect: ?SelectQuery,
};

export type NavigateQuery = {
  +id: string,
  +name: 'navigate',
  +path: string,
  +context: Context,
  +regular: boolean,
  +savedSelect: ?SelectQuery,
};

/**
 * Select query combinator.
 */
export type SelectQuery = {
  +id: string,
  +name: 'select',

  /**
   * Select fields, each field maps to a pipeline.
   */
  +select: {[name: string]: QueryPipeline},

  /**
   * Current sorting state.
   */
  +sort: ?{
    navigatePath: Array<string>,
    dir: 'asc' | 'desc',
  },

  +context: Context,
  +savedSelect: ?SelectQuery,
};

type DefineQueryBinding = {
  +name: string,
  +query: QueryPipeline,
};

export type DefineQuery = {
  +id: string,
  +name: 'define',
  +binding: DefineQueryBinding,
  +context: Context,
  +savedSelect: ?SelectQuery,
};

export type FilterQuery = {
  +id: string,
  +name: 'filter',
  +predicate: Expression,
  +context: Context,
  +savedSelect: ?SelectQuery,
};

export type LimitQuery = {
  +id: string,
  +name: 'limit',
  +limit: number,
  +context: Context,
  +savedSelect: ?SelectQuery,
};

export type AggregateQuery = {
  +id: string,
  +name: 'aggregate',
  +aggregate: string,
  +path: ?string,
  +context: Context,
  +savedSelect: ?SelectQuery,
};

export type GroupQuery = {
  +id: string,
  +name: 'group',
  +byPath: Array<string>,
  +context: Context,
  +savedSelect: ?SelectQuery,
};

export type QueryPipeline = {
  +id: string,
  +name: 'pipeline',
  +pipeline: Array<QueryAtom>,
  +context: Context,
};

export type BinaryOperator =
  | 'equal'
  | 'notEqual'
  | 'less'
  | 'lessEqual'
  | 'greater'
  | 'greaterEqual'
  | 'greaterEqual'
  | 'contains';

export type BinaryExpression = {
  +id: string,
  +name: 'binary',
  +op: BinaryOperator,
  +left: Expression,
  +right: Expression,
  +context: Context,
};

export type UnaryOperator = 'not' | 'exists';

export type UnaryExpression = {
  +id: string,
  +name: 'unary',
  +op: UnaryOperator,
  +expression: Expression,
  +context: Context,
};

export type ConstantExpression = {
  +id: string,
  +name: 'value',
  +value: string | number | boolean | null,
  +context: Context,
};

export type LogicalBinaryOperator = 'and' | 'or';

export type LogicalBinaryExpression = {
  +id: string,
  +name: 'logicalBinary',
  +op: LogicalBinaryOperator,
  +expressions: Array<Expression>,
  +context: Context,
};

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

export type QueryName =
  | 'here'
  | 'navigate'
  | 'select'
  | 'define'
  | 'filter'
  | 'limit'
  | 'group'
  | 'aggregate'
  | 'pipeline';

export type QueryAtom =
  | HereQuery
  | NavigateQuery
  | SelectQuery
  | DefineQuery
  | FilterQuery
  | LimitQuery
  | GroupQuery
  | AggregateQuery;

export type QueryExpression = {
  +id: string,
  +name: 'query',
  +query: Query,
  +context: Context,
};

/**
 * Describe expression which are used in filter query.
 */
export type Expression =
  | NavigateQuery
  | ConstantExpression
  | BinaryExpression
  | UnaryExpression
  | LogicalBinaryExpression
  | QueryExpression;

export type ExpressionName =
  | 'navigate'
  | 'value'
  | 'binary'
  | 'unary'
  | 'logicalBinary'
  | 'query';

export const ExpressionNameSet: Set<string> = new Set([
  'navigate',
  'value',
  'binary',
  'unary',
  'logicalBinary',
  'query',
]);

/**
 * Set of queries in scope (by key).
 *
 * Usually those introduced by .define(name := ...) combinator.
 */
export type Scope = {
  [name: string]: DefineQueryBinding,
};

/**
 * Query context represents knowledge about query at any given point.
 */
export type Context = {|
  // link to the prev query context
  prev: Context,

  // domain
  domain: Domain,

  // scope which query can reference other queries from
  scope: Scope,

  // output type of the query, null means invalid type
  type: Type,

  // if the query has an error somewhere
  hasInvalidType: boolean,

  title: ?string,
|};

export type QueryNavigation = {
  type: 'record' | 'attribute',
  card: TypeCardinality,
  context: Context,
  regularContext: Context,
  value: string,
  label: string,

  groupBy?: boolean,
  fromQuery?: boolean,
};

export type QueryLoc<Q: QueryAtom = QueryAtom> = {
  +rootQuery: QueryPipeline,
  +at: string,
  _query: ?Q,
  _path: ?QueryPath,
};

export type QueryPathItem =
  | {at: 'pipeline', index: number, query: QueryPipeline}
  | {at: 'select', key: string, query: SelectQuery}
  | {at: 'binding', query: DefineQuery};

export type QueryPath = Array<QueryPathItem>;

export type ResolvedQueryLoc<Q: QueryAtom = QueryAtom> = [Q, QueryPath];

export type ExportFormat = {
  label: string,
  mimetype: string,
  extension: string,
};
/* eslint-enable no-use-before-define */
