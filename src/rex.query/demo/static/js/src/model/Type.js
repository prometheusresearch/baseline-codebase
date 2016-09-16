/**
 * This module implements type system model.
 *
 * @flow
 */

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

export type TypeAtom
  = VoidType
  | EntityType
  | NumberType
  | TextType
  | RecordType;

export type Type
  = VoidType
  | EntityType
  | NumberType
  | TextType
  | RecordType
  | SeqCardinality<*>
  | OptCardinality<*>;

export function entityType(entity: string): EntityType {
  return {name: 'entity', entity};
}

export const numberType: NumberType = {name: 'number'};
export const textType: TextType = {name: 'text'};
export const voidType: VoidType = {name: 'void'};

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
