/**
 * @flow
 */

import type {TypeCardinality, Context} from '../model';

import * as t from './Type';
import * as q from './Query';

/**
 * Objects of this type represent possible navigations.
 */
export type QueryNavigation = {
  type: 'record' | 'attribute';
  card: TypeCardinality;
  context: Context;
  regularContext: Context;
  value: string;
  label: string;

  groupBy?: boolean;
  fromQuery?: boolean;
};

/**
 * Get possible navigations at the given context.
 */
export function getNavigation(
  context: Context,
  local?: boolean = true
): Map<string, QueryNavigation> {
  let {scope, domain, type} = context;
  let navigation = new Map();

  let localContext = q.regularizeContext(context);

  // Collect paths from an input type
  if (type.name === 'void') {
    for (let k in domain.entity) {
      if (domain.entity.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(localContext, q.navigate(k));
        navigation.set(k, {
          type: 'record',
          card: 'seq',
          value: k,
          label: domain.entity[k].title,
          context: navQuery.context,
          regularContext: local ? navQuery.context : q.inferQueryType(context, navQuery).context,
        });
      }
    }
  } else if (type.name === 'record') {
    let attribute = t.recordAttribute(type);
    for (let k in attribute) {
      if (attribute.hasOwnProperty(k)) {
        let navQuery = q.inferQueryType(localContext, q.navigate(k));
        let type = attribute[k].type;
        navigation.set(k, {
          type: type.name === 'record'
            ? 'record'
            : 'attribute',
          card: type.card,
          value: k,
          label: attribute[k].title || k,
          context: navQuery.context,
          regularContext: local ? navQuery.context : q.inferQueryType(context, navQuery).context,
          groupBy: attribute[k].groupBy,
        });
      }
    }
  }

  for (let k in scope) {
    if (scope.hasOwnProperty(k)) {
      let navQuery = q.inferQueryType(localContext, scope[k].query);
      let type = navQuery.context.type;
      navigation.set(k, {
        type: type.name === 'record' ? 'record' : 'attribute',
        card: type.card,
        value: k,
        label: scope[k].query.context.title || k,
        context: navQuery.context,
        regularContext: local ? navQuery.context : q.inferQueryType(context, navQuery).context,
        fromQuery: true,
      });
    }
  }

  return navigation;
}

