/**
 * This module implements type system model.
 *
 * @flow
 */

/* eslint-disable no-use-before-define */

/**
 * Domain represents data schema.
 */
export type Domain = {

  // Aggregate catalogue.
  aggregate: {
    [aggregateName: string]: DomainAggregate;
  };

  // Entity catalogue (tables).
  entity: {
    [entityName: string]: DomainEntity;
  };
};

export type DomainAggregate = {
  title: string;
  name: string;
  isAllowed: (typ: Type) => boolean;
  makeType: (typ: Type) => Type;
};

export type DomainEntity = {
  title: string;
  attribute: DomainAttributeMap;
};

export type DomainAttribute = {
  title: string;
  type: Type;
  groupBy?: boolean;
};

export type DomainAttributeMap = {
  [name: string]: DomainAttribute;
};

export type Type
  = VoidType
  | NumberType
  | BooleanType
  | TextType
  | EnumerationType
  | DateType
  | TimeType
  | DateTimeType
  | RecordType
  | SeqCardinality<*>
  | OptCardinality<*>;

export type TypeAtom
  = VoidType
  | NumberType
  | TextType
  | BooleanType
  | EnumerationType
  | DateType
  | TimeType
  | DateTimeType
  | RecordType;
/* eslint-enable no-use-before-define */

export type VoidType = {
  name: 'void';
  domain: Domain;
};

export type TextType = {
  name: 'text';
  domain: Domain;
};

export type NumberType = {
  name: 'number';
  domain: Domain;
};

export type BooleanType = {
  name: 'boolean';
  domain: Domain;
};

export type EnumerationType = {
  name: 'enumeration';
  enumerations: Array<string>;
  domain: Domain;
};

export type DateType = {
  name: 'date';
  domain: Domain;
};

export type TimeType = {
  name: 'time';
  domain: Domain;
};

export type DateTimeType = {
  name: 'datetime';
  domain: Domain;
};

export type RecordType = {
  name: 'record';
  entity: ?string;
  attribute: ?DomainAttributeMap;
  domain: Domain;
}

export type SeqCardinality<T: TypeAtom> = {
  name: 'seq';
  type: T;
  domain: Domain;
};

export type OptCardinality<T: TypeAtom> = {
  name: 'opt';
  type: T;
  domain: Domain;
};

export function createDomain(spec: {
  entity: {
    [name: string]: (domain: Domain) => DomainEntity
  };
  aggregate: {
    [name: string]: DomainAggregate;
  };
}): Domain {
  let domain: Domain = {entity: {}, aggregate: spec.aggregate};
  for (let k in spec.entity) {
    if (spec.entity.hasOwnProperty(k)) {
      domain.entity[k] = spec.entity[k](domain);
    }
  }
  return domain;
}

export function numberType(domain: Domain): NumberType {
  return {name: 'number', domain};
}

export function textType(domain: Domain): TextType {
  return {name: 'text', domain};
}

export function voidType(domain: Domain): VoidType {
  return {name: 'void', domain};
}

export function booleanType(domain: Domain): BooleanType {
  return {name: 'boolean', domain};
}

export function dateType(domain: Domain): DateType {
  return {name: 'date', domain};
}

export function timeType(domain: Domain): TimeType {
  return {name: 'time', domain};
}

export function dateTimeType(domain: Domain): DateTimeType {
  return {name: 'datetime', domain};
}

export function enumerationType(
  domain: Domain,
  enumerations: Array<string>
): EnumerationType {
  return {name: 'enumeration', enumerations, domain};
}

export function entityType(domain: Domain, entity: string): RecordType {
  return {name: 'record', entity, attribute: null, domain};
}

export function recordType(
  domain: Domain,
  attribute: DomainAttributeMap,
): RecordType {
  return {name: 'record', entity: null, attribute, domain};
}

export function recordAttribute(type: RecordType) {
  if (type.attribute != null) {
    return type.attribute;
  } else if (type.entity != null) {
    return type.domain.entity[type.entity].attribute;
  } else {
    return {};
  }
}

export function seqType<T: TypeAtom>(
  type: T | SeqCardinality<T> | OptCardinality<T>
): SeqCardinality<T> {
  if (type.name === 'opt') {
    return {name: 'seq', type: type.type, domain: type.domain};
  } else if (type.name === 'seq') {
    return type;
  } else {
    return {name: 'seq', type, domain: type.domain};
  }
}

export function optType<T: TypeAtom>(
  type: T | SeqCardinality<T> | OptCardinality<T>
): OptCardinality<T> | SeqCardinality<T> {
  if (type.name === 'opt') {
    return type;
  } else if (type.name === 'seq') {
    return seqType(type.type);
  } else {
    return {name: 'opt', type, domain: type.domain};
  }
}

export function leastUpperBound(a: Type, b: Type): Type {
  if (a.name === 'seq') {
    if (b.name === 'seq') {
      return b;
    } else if (b.name === 'opt') {
      return seqType(b.type);
    } else {
      return seqType(b);
    }
  } else if (a.name === 'opt') {
    if (b.name === 'seq' || b.name === 'opt') {
      return b;
    } else {
      return optType(b);
    }
  } else {
    return b;
  }
}

export function atom(typ: Type): TypeAtom {
  if (typ.name === 'opt' || typ.name === 'seq') {
    return typ.type;
  } else {
    return typ;
  }
}

export function maybeAtom(typ: ?Type): ?TypeAtom {
  if (typ == null) {
    return null;
  } else if (typ.name === 'opt' || typ.name === 'seq') {
    return typ.type;
  } else {
    return typ;
  }
}

export function toString(type: ?Type): string {
  if (type == null) {
    return '';
  } else if (type.name === 'seq') {
    return `[${toString(type.type)}]`;
  } else if (type.name === 'opt') {
    return `?${toString(type.type)}`;
  } else if (type.name === 'record' && type.entity != null) {
    return type.entity;
  } else {
    return type.name;
  }
}
