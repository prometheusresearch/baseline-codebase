'use strict';


/**
 * This is a class that provides lazily-generated strings. This object does
 * its best to act like a String, but the value changes every time it is
 * evaluated based on the return value of the function you provide.
 *
 * @class LazyString
 * @constructor
 * @param {Function} func The function to call to retrieve/generate the actual
 *      string.
 */
var LazyString = function (func) {
  if (!(this instanceof LazyString)) {
    return new LazyString(func);
  }

  this.generator = func;
};

LazyString.prototype.toString = function () {
  return this.generator();
};

LazyString.prototype.valueOf = function () {
  return this.toString();
};


module.exports = {
  LazyString: LazyString
};

