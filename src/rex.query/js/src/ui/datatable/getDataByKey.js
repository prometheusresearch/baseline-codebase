/**
 * @flow
 */

export default function getDataByKey(
  item: Object,
  dataKey: Array<string>,
  focus?: Array<string>,
) {
  //console.log(dataKey, focus);
  if (dataKey.length === 0) {
    return item;
  } else if (dataKey.length === 1) {
    return item[dataKey[0]];
  } else if (dataKey.length === 2) {
    if (
      item.__index__ != null &&
      item.__index__ !== 0 &&
      (focus == null ||
        (focus.length > 1 && !(focus[0] === dataKey[0] && focus[1] === dataKey[1])))
    ) {
      return undefined;
    }

    item = item[dataKey[0]];
    if (item == null) {
      return item;
    }

    if (
      item.__index__ != null &&
      item.__index__ !== 0 &&
      (focus == null ||
        (focus.length > 1 && !(focus[0] === dataKey[0] && focus[1] === dataKey[1])))
    ) {
      return undefined;
    }
    return item[dataKey[1]];
  } else {
    for (let i = 0; i < dataKey.length; i++) {
      item = item[dataKey[i]];
      if (item == null) {
        return item;
      }
      if (
        item.__index__ != null &&
        item.__index__ !== 0 &&
        (focus == null ||
          (focus.length > dataKey.length - 1 && !keyIsInFocus(focus, dataKey)))
      ) {
        return undefined;
      }
    }
    return item;
  }
}

function keyIsInFocus(focus, dataKey) {
  for (let i = 0; i < dataKey.length; i++) {
    if (focus[i] !== dataKey[i]) {
      return false;
    }
  }
  return true;
}
