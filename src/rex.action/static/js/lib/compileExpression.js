/**
 * @copyright 2017-present, Prometheus Research, LLC
 * @flow
 */

export default function compileExpression(source: string, scope: Object): Function {
  let expr = new Function('entity', 'return (' + source + ');');
  expr.scope = scope;
  return expr;
}
