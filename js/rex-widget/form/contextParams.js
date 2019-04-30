/**
 * @copyright 2016, Prometheus Research, LLC
 */

export default function contextParams(context) {
  let params = {};
  for (let key in context) {
    if (context.hasOwnProperty(key)) {
      let value = context[key];
      if (value['meta:type'] !== undefined) {
        params[':' + key] = value.id;
      } else {
        params[':' + key] = value;
      }
    }
  }
  return params;
}
