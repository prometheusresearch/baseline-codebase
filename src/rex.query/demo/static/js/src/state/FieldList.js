/**
 * @flow
 */

/* eslint-disable no-use-before-define */

import type {
  Query,
  DomainEntity,
} from '../model';

import * as q from '../model/Query';
import * as t from '../model/Type';

/**
 * Field is a key + a list of subfields.
 */
export type Field = {
  name: string;
  children: FieldList
};

/**
 * A list of fields.
 */
export type FieldList = Array<Field>;

/**
 * A path inside field list.
 */
export type FieldPath = Array<string>;

export function make(name: string, ...children: Array<Field>): Field {
  return {name, children};
}

export function findBy(fieldList: FieldList, field: string | Field): ?FieldList {
  if (typeof field !== 'string') {
    field = field.name;
  }
  for (let i = 0; i < fieldList.length; i++) {
    let f = fieldList[i];
    if (f.name === field) {
      return f.children;
    }
  }
  return null;
}

export function findIndexBy(fieldList: FieldList, field: string | Field): number {
  if (typeof field !== 'string') {
    field = field.name;
  }
  for (let i = 0; i < fieldList.length; i++) {
    let f = fieldList[i];
    if (f.name === field) {
      return i;
    }
  }
  return -1;
}

/**
 * Produce a field list from a query.
 */
export function fromQuery(query: Query): FieldList {
  let fieldList = [];
  let {type, domain, scope} = query.context;
  if (type != null) {
    type = t.atom(type);
    if (type.name === 'entity') {
      let attribute = domain.entity[type.entity].attribute;
      for (let k in attribute) {
        if (!attribute.hasOwnProperty(k)) {
          continue;
        }
        let type = attribute[k].type;
        let baseType = t.atom(type);
        if (type.name === 'seq') {
          continue;
        }
        if (baseType.name === 'entity') {
          fieldList.push(make(k, ...fromDomainEntity(domain.entity[baseType.entity])));
        } else {
          fieldList.push(make(k));
        }
      }
    } else if (type.name === 'text') {
      fieldList.push(make('0'));
    } else if (type.name === 'number') {
      fieldList.push(make('0'));
    }
  }

  for (let k in scope) {
    if (!scope.hasOwnProperty(k)) {
      continue;
    }
    let item = q.inferTypeStep(query.context, scope[k]);
    let type = item.context.type;
    if (type) {
      if (type.name === 'seq') {
        continue;
      }
      let baseType = t.atom(type);
      if (baseType.name === 'entity') {
        fieldList.push(make(k, ...fromDomainEntity(domain.entity[baseType.entity])));
      } else {
        fieldList.push(make(k));
      }
    } else {
      fieldList.push(make(k));
    }
  }

  return fieldList;
}

export function fromDomainEntity(entity: DomainEntity): FieldList {
  let fieldList = [];
  for (let k in entity.attribute) {
    if (entity.attribute.hasOwnProperty(k)) {
      let type = entity.attribute[k].type;
      let baseType = t.atom(type);
      if (type.name === 'seq' || baseType.name === 'entity') {
        continue;
      }
      fieldList.push(make(k));
    }
  }
  return fieldList;
}

export function remove(fieldList: FieldList, path: Array<string>): FieldList {
  if (path.length === 0) {
    return fieldList;
  }
  let [first, ...rest] = path;
  fieldList = fieldList.slice(0);
  let toRemove = [];
  for (let i = 0; i < fieldList.length; i++) {
    let field = fieldList[i];
    if (field.name === first) {
      field = {name: field.name, children: remove(field.children, rest)};
      fieldList[i] = field;
      if (field.children.length === 0 || rest.length === 0) {
        toRemove.unshift(i);
      }
    }
  }
  for (let i = 0; i < toRemove.length; i++) {
    fieldList.splice(toRemove[i], 1);
  }
  return fieldList;
}

export function add(fieldList: FieldList, path: Array<string>): FieldList {
  if (path.length === 0) {
    return fieldList;
  }
  let [first, ...rest] = path;
  for (let i = 0; i < fieldList.length; i++) {
    let field = fieldList[i];
    if (field.name === first) {
      fieldList = fieldList.slice(0);
      fieldList[i] = make(field.name, ...add(field.children, rest));
      return fieldList;
    }
  }
  return fieldList.concat(make(first, ...add([], rest)));
}

export function merge(fieldList: FieldList, toMerge: FieldList): FieldList {
  if (toMerge.length === 0) {
    return fieldList;
  }
  fieldList = fieldList.slice(0);
  for (let i = 0; i < toMerge.length; i++){
    let idx = findIndexBy(fieldList, toMerge[i]);
    if (idx === -1) {
      fieldList.push(toMerge[i]);
    } else {
      let field = fieldList[idx];
      fieldList[idx] = make(field.name, ...merge(field.children, toMerge[i].children));
    }
  }
  return fieldList;
}

export function contains(fieldList: FieldList, path: Array<string>): boolean {
  for (let i = 0; i < path.length; i++) {
    let idx = findIndexBy(fieldList, make(path[i]));
    if (idx > -1){
      fieldList = fieldList[idx].children;
    } else {
      return false;
    }
  }
  return true;
}

export function toQuery(fieldList: FieldList): Query {
  let select = {};
  for (let i = 0; i < fieldList.length; i++) {
    let field = fieldList[i];
    if (field.children.length > 0) {
      select[field.name] = q.pipeline(q.navigate(field.name), toQuery(field.children));
    } else {
      select[field.name] = q.navigate(field.name);
    }
  }
  return q.select(select);
}

export function addSelect(query: Query, fieldList: FieldList = []) {
  let select = toQuery(fieldList);
  let nextQuery;
  if (query.name === 'pipeline') {
    let pipeline = query.pipeline.slice(0).concat(select);
    nextQuery = {name: 'pipeline', context: query.context, pipeline};
  } else {
    nextQuery = q.pipeline(query, select);
  }
  return q.inferType(query.context.domain, nextQuery);
}

export function pathToFieldList(path: FieldPath, fieldList?: FieldList = []): FieldList {
  if (path.length === 0) {
    return [];
  }
  let field = make(path[path.length - 1], ...fieldList);
  for (let i = path.length - 2; i >= 0; i--) {
    field = {name: path[i], children: [field]};
  }
  return [field];
}
