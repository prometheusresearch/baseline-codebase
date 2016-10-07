/**
 * @flow
 */

export function sum(array: Array<number>): number {
  let sum = 0;
  for (let i = 0; i < array.length; i++) {
    sum = sum + array[i];
  }
  return sum;
}

export function max(array: Array<number>): number {
  return Math.max(...array);
}

export function transpose(obj: Object, keyPath: Array<string>): Array<Object> {
  if (keyPath.length > 0) {
    let [key, ...nextKeyPath] = keyPath;
    if (obj[key] != null && obj[key].length > 0) {
      let result = [];
      for (let index = 0; index < obj[key].length; index++) {
        if (nextKeyPath.length > 0) {
          let nextObj = transpose(obj[key][index], nextKeyPath);
          for (let nextIndex = 0; nextIndex < nextObj.length; nextIndex++) {
            result.push({
              ...obj,
              __index__: index,
              [key]: nextObj[nextIndex],
            });
          }
        } else {
          result.push({
            ...obj,
            __index__: index,
            [key]: obj[key][index],
          });
        }
      }
      return result;
    } else {
      return [{
        ...obj,
        __index__: 0,
        [key]: {}
      }];
    }
  } else {
    return [obj];
  }
}
