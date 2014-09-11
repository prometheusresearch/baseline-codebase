/**
 * @jsx React.DOM
 */
'use strict';

function capitalized({value}) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

function currency({value}) {
  return value ? '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
}

function resolve(spec) {
  if (spec !== 'resolve' && module.exports[spec]) {
    return module.exports[spec];
  } else {
    return getByPath(spec);
  }
}

function getByPath(spec) {
  if (spec.indexOf(':') > -1) {
    var [mod, path] = spec.split(':', 2);
    mod = __require__(mod);
    path = path.split('.')
    for (var i = 0, len = path.length; i < len; i++) {
      if (mod === undefined || mod === null) {
        return mod;
      }
      mod = mod[path[i]];
    }
    return mod;
  } else {
    return __require__(spec);
  }
}

module.exports = {capitalized, currency, resolve};
