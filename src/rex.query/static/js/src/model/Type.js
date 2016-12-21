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

export const emptyDomain = {aggregate: {}, entity: {}};

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
  | InvalidType
  | RecordType;

/* eslint-enable no-use-before-define */

export type TypeCardinality =
  | 'seq'
  | 'opt'
  | null;

type TypeCardinalityProp = {
  card: TypeCardinality;
};

export type InvalidType = {
  name: 'invalid',
  domain: Domain;
  card: null;
};

export type VoidType = {
  name: 'void';
  domain: Domain;
} & TypeCardinalityProp;

export type TextType = {
  name: 'text';
  domain: Domain;
} & TypeCardinalityProp;

export type NumberType = {
  name: 'number';
  domain: Domain;
} & TypeCardinalityProp;

export type BooleanType = {
  name: 'boolean';
  domain: Domain;
} & TypeCardinalityProp;

export type EnumerationType = {
  name: 'enumeration';
  enumerations: Array<string>;
  domain: Domain;
} & TypeCardinalityProp;

export type DateType = {
  name: 'date';
  domain: Domain;
} & TypeCardinalityProp;

export type TimeType = {
  name: 'time';
  domain: Domain;
} & TypeCardinalityProp;

export type DateTimeType = {
  name: 'datetime';
  domain: Domain;
} & TypeCardinalityProp;

export type RecordType = {
  name: 'record';
  entity: ?string;
  attribute: ?DomainAttributeMap;
  domain: Domain;
} & TypeCardinalityProp;

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

export function invalidType(domain: Domain): InvalidType {
  return {name: 'invalid', card: null, domain};
}

export function numberType(domain: Domain): NumberType {
  return {name: 'number', card: null, domain};
}

export function textType(domain: Domain): TextType {
  return {name: 'text', card: null, domain};
}

export function voidType(domain: Domain): VoidType {
  return {name: 'void', card: null, domain};
}

export function booleanType(domain: Domain): BooleanType {
  return {name: 'boolean', card: null, domain};
}

export function dateType(domain: Domain): DateType {
  return {name: 'date', card: null, domain};
}

export function timeType(domain: Domain): TimeType {
  return {name: 'time', card: null, domain};
}

export function dateTimeType(domain: Domain): DateTimeType {
  return {name: 'datetime', card: null, domain};
}

export function enumerationType(
  domain: Domain,
  enumerations: Array<string>
): EnumerationType {
  return {name: 'enumeration', card: null, enumerations, domain};
}

export function entityType(domain: Domain, entity: string): RecordType {
  return {name: 'record', card: null, entity, attribute: null, domain};
}

export function recordType(
  domain: Domain,
  attribute: DomainAttributeMap,
): RecordType {
  return {name: 'record', card: null, entity: null, attribute, domain};
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

export function seqType<T: Type>(type: T): T {
  if (type.name === 'invalid') {
    return type;
  }
  if (type.card !== 'seq') {
    let nextType: any = {...type, card: 'seq'};
    return (nextType: T);
  } else {
    return type;
  }
}

export function optType<T: Type>(type: T): T {
  if (type.name === 'invalid') {
    return type;
  }
  if (type.card === null) {
    let nextType: any = {...type, card: 'opt'};
    return (nextType: T);
  } else {
    return type;
  }
}

export function regType<T: Type>(type: T): T {
  if (type.name === 'invalid') {
    return type;
  }
  if (type.card !== null) {
    let nextType: any = {...type, card: null};
    return (nextType: T);
  } else {
    return type;
  }
}

export function leastUpperBound(a: Type, b: Type): Type {
  if (a.card === 'seq') {
    if (b.card === 'seq') {
      return b;
    } else {
      return seqType(b);
    }
  } else if (a.card === 'opt') {
    if (b.card != null) {
      return b;
    } else {
      return optType(b);
    }
  } else {
    return b;
  }
}

export function toString(type: Type): string {
  if (type.card === 'seq') {
    return `[${toString(regType(type))}]`;
  } else if (type.card === 'opt') {
    return `?${toString(regType(type))}`;
  } else if (type.name === 'record') {
    if (type.entity != null) {
      return type.entity;
    } else {
      let fieldList = [];
      let attribute = recordAttribute(type);
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          fieldList.push(`${k}: ${toString(attribute[k].type)}`);
        }
      }
      return `{${fieldList.join(', ')}}`;
    }
  } else {
    return type.name;
  }
}