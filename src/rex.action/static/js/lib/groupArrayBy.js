/**
 * @copyright 2016, Prometheus Research, LLC
 */

/**
 * Group `array` items using a provided `keyFunc`.
 */
export default function groupArrayBy(array, keyFunc) {
  let result = [];
  let currentArray = [];
  let currentKey = {}; // sentinel
  for (let i = 0; i < array.length; i++) {
    let item = array[i];
    let key = keyFunc(item);
    if (key === currentKey) {
      currentArray.push(item);
    } else {
      if (currentArray.length > 0) {
        result.push(currentArray);
      }
      currentArray = [item];
      currentKey = key;
    }
  }
  if (currentArray.length > 0) {
    result.push(currentArray);
  }
  return result;
}
