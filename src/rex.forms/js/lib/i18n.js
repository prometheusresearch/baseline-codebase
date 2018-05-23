/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

export function translate(string, ...values) {
  let result = '';
  for (let i = 0; i < string.length; i++) {
    result += string[i];
    if (i < string.length - 1) {
      result += String(values[i]);
    }
  }
  return result;
}
