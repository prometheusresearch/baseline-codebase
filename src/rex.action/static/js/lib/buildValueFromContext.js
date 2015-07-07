/**
 * @copyright 2015, Prometheus Research, LLC
 */

export default function buildValueFromContext(spec, context) {
  let value;
  if (Array.isArray(spec)) {
    value = [];
    for (let i = 0; i < spec.length; i++) {
      let item = buildValueFromContext(spec[i], context);
      if (!isEmptyValue(item)) {
        value.push(item);
      }
    }
  } else {
    value = {};
    for (let key in spec) {
      if (spec.hasOwnProperty(key)) {
        let item = spec[key];
        if (item[0] === '$') {
          value[key] = context[item.substr(1)];
        } else {
          value[key] = item;
          if (typeof value[key] === 'object') {
            value[key] = buildValueFromContext(value[key], context);
          }
        }
      }
    }
  }
  return value;
}

function isEmptyValue(obj) {
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    if (obj[keys[i]] != undefined) {
      return false;
    }
  }
  return true;
}
