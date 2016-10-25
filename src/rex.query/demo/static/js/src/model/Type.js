/**
 * This module implements type system model.
 *
 * @flow
 */

/* eslint-disable no-use-before-define */
export type Type
  = VoidType
  | EntityType
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
  | EntityType
  | NumberType
  | TextType
  | BooleanType
  | EnumerationType
  | DateType
  | TimeType
  | DateTimeType
  | RecordType;
/* eslint-enable no-use-before-define */

export type EntityType = {
  name: 'entity';
  entity: string;
}

export type VoidType = {
  name: 'void';
};

export type TextType = {
  name: 'text';
};

export type NumberType = {
  name: 'number';
};

export type BooleanType = {
  name: 'boolean';
};

export type EnumerationType = {
  name: 'enumeration';
  enumerations: Array<string>;
};

export type DateType = {
  name: 'date';
};

export type TimeType = {
  name: 'time';
};

export type DateTimeType = {
  name: 'datetime';
};

export type RecordType = {
  name: 'record';
  fields: {[fieldName: string]: Type};
}

export type SeqCardinality<T: TypeAtom> = {
  name: 'seq';
  type: T;
};

export type OptCardinality<T: TypeAtom> = {
  name: 'opt';
  type: T;
};

export function entityType(entity: string): EntityType {
  return {name: 'entity', entity};
}

export const numberType: NumberType = {name: 'number'};
export const textType: TextType = {name: 'text'};
export const voidType: VoidType = {name: 'void'};
export const booleanType: BooleanType = {name: 'boolean'};
export const dateType: DateType = {name: 'date'};
export const timeType: TimeType = {name: 'time'};
export const dateTimeType: DateTimeType = {name: 'datetime'};

export function enumerationType(enumerations: Array<string>): EnumerationType {
  return {name: 'enumeration', enumerations};
}

export function recordType(fields: {[fieldName: string]: Type}): RecordType {
  return {name: 'record', fields};
}

export function seqType<T: TypeAtom>(type: T | SeqCardinality<T> | OptCardinality<T>): SeqCardinality<T> {
  if (type.name === 'opt') {
    return {name: 'seq', type: type.type};
  } else if (type.name === 'seq') {
    return type;
  } else {
    return {name: 'seq', type};
  }
}

export function optType<T: TypeAtom>(type: T | SeqCardinality<T> | OptCardinality<T>): OptCardinality<T> | SeqCardinality<T> {
  if (type.name === 'opt') {
    return type;
  } else if (type.name === 'seq') {
    return seqType(type.type);
  } else {
    return {name: 'opt', type};
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
  } else if (type.name === 'entity') {
    return type.entity;
  } else {
    return type.name;
  }
}
