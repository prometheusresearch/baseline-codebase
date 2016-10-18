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
  return getNavigation(context, context.inputType);
}


export function getNavigationAfter(context: q.Context): Array<Navigation> {
  return getNavigation(context, context.type);
}


export function getNavigation(context: q.Context, type: ?t.Type) {
  let {scope, domain} = context;
  let navigation = [];

  let contextAtQuery = {
    ...context,
    type: t.maybeAtom(type),
  };

  // Collect paths from an input type
  if (type != null) {
    let baseType = t.atom(type);
    if (baseType.name === 'void') {
      for (let k in domain.entity) {
        if (domain.entity.hasOwnProperty(k)) {
          navigation.push({
            value: k,
            label: domain.entity[k].title,
            context: q.inferTypeStep(contextAtQuery, q.navigate(k)).context,
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
            context: q.inferTypeStep(contextAtQuery, q.navigate(k)).context,
          });
        }
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      navigation.push({
        value: k,
        label: k,
        context: q.inferTypeStep(contextAtQuery, scope[k]).context,
      });
    }
  }

  return navigation;
}

