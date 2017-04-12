/**
 * This module implements type system model.
 *
 * @flow
 */

import type {
  Domain,
  DomainEntity,
  DomainAggregate,
  DomainAttributeMap,
  Type,
  InvalidType,
  RecordType,
  EnumerationType,
  NumberType,
  TextType,
  JSONType,
  VoidType,
  BooleanType,
  DateType,
  TimeType,
  DateTimeType,
} from './types';

export function createDomain(
  spec: {
    entity: {
      [name: string]: (domain: Domain) => DomainEntity,
    },
    aggregate: {
      [name: string]: DomainAggregate,
    },
  },
): Domain {
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

export function jsonType(domain: Domain): JSONType {
  return {name: 'json', card: null, domain};
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
  enumerations: Array<string>,
): EnumerationType {
  return {name: 'enumeration', card: null, enumerations, domain};
}

export function entityType(domain: Domain, entity: string): RecordType {
  return {name: 'record', card: null, entity, attribute: null, domain};
}

export function recordType(domain: Domain, attribute: DomainAttributeMap): RecordType {
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
