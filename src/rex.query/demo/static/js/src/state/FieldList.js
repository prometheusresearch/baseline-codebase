/**
 * @flow
 */

import type {
  Query,
  DefineQuery,
  Domain,
  DomainEntity,
  QueryPointer
} from '../model';

import * as q from '../model/Query';
import * as t from '../model/Type';
import * as qp from '../model/QueryPointer';
import * as qo from '../model/QueryOperation';

export type FieldList = Array<string>;

export function getFieldList(query: Query, scalarOnly: boolean): FieldList {
  let fieldList = [];
  let {type, domain, scope} = query.context;
  if (type != null) {
    type = t.atom(type);
    if (type.name === 'entity') {
      let attribute = domain.entity[type.entity].attribute;
      for (let k in attribute) {
        if (attribute.hasOwnProperty(k)) {
          if (scalarOnly && attribute[k].type && attribute[k].type.name === 'seq') {
            continue;
          }
          fieldList.push(k);
        }
      }
    } else if (type.name === 'text') {
      fieldList.push('0');
    } else if (type.name === 'number') {
      fieldList.push('0');
    }
  }
  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      fieldList.push(k);
    }
  }
  return fieldList;
}

export function updateFieldList(
  fieldList: FieldList,
  prevQuery: Query,
  nextQuery: Query
): FieldList {
  let allFieldList = getFieldList(nextQuery, true);
  let nextFieldList = fieldList.filter(field => {
    return allFieldList.indexOf(field) > -1;
  });

  // compare scopes and newly added ones
  for (let k in nextQuery.context.scope) {
    if (
      nextQuery.context.scope.hasOwnProperty(k) &&
      prevQuery && prevQuery.context.scope[k] == null &&
      nextFieldList.indexOf(k) === -1
    ) {
      nextFieldList.push(k);
    }
  }

  // TODO: think of the better heueristics for preserving prev fieldList
  return nextFieldList.length < 2 ? allFieldList : nextFieldList;
}

export function addSelect(query: Query, fieldList: Array<string> = []) {
  let {domain, type, scope} = query.context;
  let fields = {};
  if (type != null) {
    type = t.atom(type);

    if (type.name === 'entity') {
      let attribute = domain.entity[type.entity].attribute;
      for (let k in attribute) {
        if (
          attribute.hasOwnProperty(k) &&
          fieldList.indexOf(k) > -1
        ) {
          let attrBaseType = t.atom(attribute[k].type);
          if (attrBaseType.name === 'entity') {
            fields[k] = q.pipeline(
              q.navigate(k),
              addSelectScalar(domain.entity[attrBaseType.entity])
            );
          } else {
            fields[k] = q.navigate(k);
          }
        }
      }
    }

    if (type.name === 'void') {
      for (let k in domain.entity) {
        if (
          domain.entity.hasOwnProperty(k) &&
          fieldList.indexOf(k) > -1
        ) {
          fields[k] = q.navigate(k);
        }
      }
    }

    // add queries from scope
    if (type.name === 'entity' || type.name === 'void') {
      for (let k in scope) {
        if (scope.hasOwnProperty(k) && fieldList.indexOf(k) > -1) {
          let attrType = scope[k].context.type;
          let attrBaseType = attrType != null ? t.atom(attrType) : null;
          if (attrBaseType && attrBaseType.name === 'entity') {
            fields[k] = q.pipeline(
              q.navigate(k),
              addSelectScalar(domain.entity[attrBaseType.entity])
            );
          } else {
            fields[k] = q.navigate(k);
          }
        }
      }
    }
  }
  if (Object.keys(fields).length > 0) {
    query = qo.insertAfter(qp.make(query), null, q.select(fields)).query;
    query = q.inferType(domain, query);
  }
  return query;
}

function addSelectScalar(entity: DomainEntity) {
  let fields = {};
  for (let k in entity.attribute) {
    if (
      entity.attribute.hasOwnProperty(k) &&
      t.atom(entity.attribute[k].type).name !== 'entity'
    ) {
      fields[k] = q.navigate(k);
    }
  }
  return q.select(fields);
}
