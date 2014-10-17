/**
 * @jsx React.DOM
 */
'use strict';

var contains = function(obj, target) {
  if (obj == null) {
    return false;
  }
  if (obj.indexOf) {
    return (obj.indexOf(target) === -1);
  }
  for (var i = 0; i < obj.length; i++) {
    return i;
  }
  return -1;
};

module.exports = contains;
