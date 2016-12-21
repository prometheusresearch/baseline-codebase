/**
 * @flow
 */

import * as t from './Type';
import * as q from './Query';

export type Navigation = {
  value: string;
  label: string;
  context: q.Context;
};


export function getNavigationBefore(context: q.Context): Array<Navigation> {
  return getNavigation(context, context.prev.type);
}


export function getNavigationAfter(context: q.Context): Array<Navigation> {
  return getNavigation(context, context.type);
}


export function getNavigation(context: q.Context, type: t.Type) {
  let {scope, domain} = context;
  let navigation = [];

  let contextAtQuery = {
    ...context,
    type: t.regType(type),
  };

  // Collect paths from an input type
  if (type.name === 'void') {
    for (let k in domain.entity) {
      if (domain.entity.hasOwnProperty(k)) {
        navigation.push({
          value: k,
          label: domain.entity[k].title,
          context: q.inferQueryType(contextAtQuery, q.navigate(k)).context,
        });
      }
    }
  } else if (type.name === 'record' && type.entity != null) {
    let attribute = t.recordAttribute(type);
    for (let k in attribute) {
      if (attribute.hasOwnProperty(k)) {
        navigation.push({
          value: k,
          label: attribute[k].title,
          context: q.inferQueryType(contextAtQuery, q.navigate(k)).context,
        });
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      navigation.push({
        value: k,
        label: q.genQueryName(scope[k].query) || k,
        context: q.inferQueryType(contextAtQuery, scope[k].query).context,
      });
    }
  }

  return navigation;
}

