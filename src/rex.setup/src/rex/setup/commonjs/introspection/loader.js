'use strict';

module.exports = function introspectionLoader(source) {
  this.cacheable();
  if (!this._compiler.__introspectables) {
    return cb(new Error(
      'loader "rex-setup/introspection/loader" should only be '
      + 'used if "rex-setup/introspection/plugin" is used'
    ));
  }
  var query = JSON.parse(this.query.slice(1));
  if (query.name) {
    this._compiler.__introspectables[this.resourcePath] = query.name;
  }
  return source;
}
