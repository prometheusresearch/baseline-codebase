/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

export default function notImplemented(target: any, key: string, desc: Object) {
  return {
    ...desc,
    value() {
      throw new Error(`${this.constructor.name}.${key}(...) is not implemented`);
    },
  };
}
