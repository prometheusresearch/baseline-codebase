/**
 * @jsx React.DOM
 */
'use strict';

var {OrderedMap} = require('immutable');

function buildRecordIndex(record) {
  var index = new OrderedMap();
  index = index.asMutable();
  record.forEach((record) => {
    index = index.set(record.get('id'), record);
  });
  index = index.asImmutable();
  return index;
}

module.exports = buildRecordIndex;
