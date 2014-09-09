/**
 * @jsx React.DOM
 */
'use strict';

var invariant = require('./invariant');
var makeURL   = require('./makeURL');

var map = undefined;

var ApplicationMap = {

  configure(conf) {
    invariant(
      map === undefined,
      'application map is already configured'
    )
      map = conf;
  },

  link(url, params, options) {
    var paramsProto = map[url];

    invariant(
      paramsProto !== undefined,
      'URL "%s" is invalid for the current configuration', url
    );

    for (var name in params) {
      if (params.hasOwnProperty(name)) {
        invariant(
          paramsProto[name],
          'invalid param "%s" for url "%s"', name, url
        );
      }
    }

    return makeURL(url, params, options);
  },

  linkUnsafe: makeURL
};

module.exports = ApplicationMap;
