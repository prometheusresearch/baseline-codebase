/**
 * @noflow
 */

import invariant from 'invariant';

import * as q from './model/Query';

export function formatQuery(query: q.Query, indent: string = ''): string {
  switch (query.name) {
    case 'here':
      return 'here';
    case 'pipeline':
      let [first, ...rest]= q.flattenPipeline(query).pipeline;
      let fmt = [formatQuery(first)];
      rest.forEach(q => {
        if (q.name === 'navigate') {
          fmt.push('\n  ' + indent + '.' + formatQuery(q));
        } else {
          fmt.push('\n  ' + indent + ':' + formatQuery(q, indent + '  '));
        }
      });
      return fmt.join('');
    case 'navigate':
      return query.path;
    case 'limit':
      return `limit(${query.limit})`;
    case 'filter':
      return `filter(${formatQuery(query.predicate)})`;
    case 'define':
      return `define(${query.binding.name} := ${formatQuery(query.binding.query, indent + ' ')})`;
    case 'aggregate':
      return `${query.aggregate}()`;
    case 'select':
      let select = [];
      for (let k in query.select) {
        if (query.select.hasOwnProperty(k)) {
          select.push(formatQuery(query.select[k], indent + '  '));
        }
      }
      return `select(${select.join(', ')})`;
    default:
      invariant(false, 'Unknown query type: %s', query.name);
  }
}
