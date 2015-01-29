/**
 * @jsx React.DOM
 */
'use strict';

var format = function (text, vars) {
  return text.replace(/(\$\{(\w+)\})/g, function (match, p1, p2, offset, string) {
    if (p2 in vars && vars[p2] !== null && vars[p2] !== undefined)
      return vars[p2];
    return '';
  });
}

module.exports = format;
