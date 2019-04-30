/**
 * @flow
 */

var q = require("./src/model/Query");
var QueryBuilderApp = require("./src/QueryBuilderApp").default;

module.exports = {
  QueryBuilderApp: QueryBuilderApp,
  serializeQuery: q.serializeQuery,
  deserializeQuery: q.deserializeQuery
};
