/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function notImplemented(target, key, desc) {
  return {
    ...desc,
    value() {
      throw new Error(`${this.constructor.name}.${key}(...) is not implemented`);
    }
  };
}
