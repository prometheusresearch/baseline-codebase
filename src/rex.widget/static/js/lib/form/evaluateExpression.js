'use strict';

var RexExpression = require('rex-expression');

var _cache = {};

function evaluateExpression(expression, value) {
  if (_cache[expression] === undefined) {
    _cache[expression] = RexExpression.parse(expression);
  }
  return _cache[expression].evaluate(function(keyPath) {
    var val = value.getIn(keyPath).value;
    if (val == null) {
      return RexExpression.Untyped.value(null);
    } if (typeof val === "string") {
      return RexExpression.String.value(val);
    } else if (typeof val === "number") {
      return RexExpression.Number.value(val);
    } else if (typeof val === "bool") {
      return RexExpression.Boolean.value(val);
    } else {
      throw new Error(`not implemented "${typeof val}" of "${val}"`);
    }
  });
}

module.exports = evaluateExpression;
