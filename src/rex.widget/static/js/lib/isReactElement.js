/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

/**
 * Function which returns true if object is a valid React element.
 */
function isReactElement(obj) {
  return (
    obj && (
      typeof obj === 'string' ||
      obj.type && obj.props
    )
  );
}

module.exports = isReactElement;
