/**
 * @flow
 */

export default function specialAssign(a: Object, b: Object, reserved: Object) {
  // This will get id, className, style, etc.
  for (let x in b) {
    if (!b.hasOwnProperty(x)) continue;
    if (reserved[x]) continue;
    a[x] = b[x];
  }
}
