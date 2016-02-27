/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as AST from '../htsql/AST';

export function getValueList(query, expression, op = '') {
  let refine = query.refine
    .filter(node => isFilterByExpression(node, expression, op));
  if (refine.length > 0) {
    return refine.map(item => item.args.substring(expression.length + 1));
  } else {
    return [];
  }
}

export function getValue(query, expression, op = '') {
  return getValueList(query, expression, op)[0];
}

export function apply(query, expression, op = '', value = '') {
  let refine = query.refine
    .concat(new AST.MethodCall('filter', `${expression}${op}${value}`));
  return new AST.Collection(query.name, refine);
}

export function remove(query, expression, op = '', value = '') {
  let refine = query.refine
    .filter(node => !isFilterByExpression(node, expression, op, value));
  return new AST.Collection(query.name, refine);
}

function isFilterByExpression(node, expression, op = '', value = '') {
  return (
    node.type === 'MethodCall' &&
    node.name === 'filter' &&
    node.args.indexOf(expression + op + value) === 0
  );
}

export function quote(value) {
  return "'" + value.replace(/'/g, "\\'") + "'";
}

export function unquote(value) {
  if (!value) {
    return value;
  }
  return value.replace(/^'/, '').replace(/'$/, '');
}
