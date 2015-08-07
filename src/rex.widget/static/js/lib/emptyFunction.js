/**
 * @copyright 2015, Prometheus Research, LLC
 */

function emptyFunction() {

}

emptyFunction.thatReturnsTrue = function() {
  return true;
};

emptyFunction.thatReturnsNull = function() {
  return null;
};

emptyFunction.thatReturnsArgument = function(arg) {
  return arg;
};

module.exports = emptyFunction;
