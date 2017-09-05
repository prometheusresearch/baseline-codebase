/**
 * @flow
 */

export default function choose<V>(...values: Array<?V>): ?V {
  for (let i = 0; i < values.length; i++) {
    if (values[i] != null) {
      return values[i];
    }
  }
}
