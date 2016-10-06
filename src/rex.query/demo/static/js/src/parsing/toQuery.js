/**
 * @flow
 */

import type {Domain, Query} from '../model/Query';
import type {Expression} from './index';

import invariant from 'invariant';
import * as q from '../model/Query';

export default function toQuery(domain: Domain, node: Expression): Query {
  switch (node.type) {
    case 'Identifier':
      return q.navigate(node.value);
    case 'BinaryOperation': {
      let {left, right, operator} = node;
      switch (operator) {
        case ':':
        case '.': {
          let pipeline = [];
          let leftQuery = toQuery(domain, left);
          if (leftQuery.name === 'pipeline') {
            pipeline = leftQuery.pipeline.concat(pipeline);
          } else {
            pipeline = [leftQuery].concat(pipeline);
          }
          let rightQuery = toQuery(domain, right);
          if (rightQuery.name === 'pipeline') {
            pipeline = pipeline.concat(rightQuery.pipeline);
          } else {
            pipeline = pipeline.concat(rightQuery);
          }
          return q.pipeline(...pipeline);
        }
        default:
          return q.navigate('individual');
      }
    }
    case 'Application':
      switch (node.name) {
        case 'filter': {
          invariant(
            node.argList.length === 1,
            'filter(predicate) requires a single argument'
          );
          return q.filter(toQuery(domain, node.argList[0]));
        }
        case 'define': {
          let arg = node.argList[0];
          if (arg == null) {
            return q.def('query', q.navigate(''));
          } else if (arg.type === 'Binding') {
            return q.def(arg.name, toQuery(domain, arg.expression));
          } else {
            return q.def('query', toQuery(domain, arg));
          }
        }
        case 'limit': {
          invariant(
            node.argList.length === 1,
            'limit(num) requires a single argument'
          );
          let arg = node.argList[0];
          invariant(
            arg.type === 'IntegerLiteral',
            'limit(num) argument should be an integer'
          );
          return q.limit(arg.value);
        }
        default:
          return q.aggregate(node.name);
      }
    default:
      invariant(false, 'Do not know how to bind: %s', node.type);
  }
}
