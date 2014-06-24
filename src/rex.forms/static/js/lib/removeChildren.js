/**
 * @jsx React.DOM
 */
'use strict';

function removeChildren(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

module.exports = removeChildren;
