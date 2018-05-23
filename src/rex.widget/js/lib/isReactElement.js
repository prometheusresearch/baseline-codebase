/**
 * @copyright 2015, Prometheus Research, LLC
 */

/**
 * Function which returns true if object is a valid React element.
 */
export default function isReactElement(obj) {
  return obj && obj.type && obj.props;
}
