/**
 * @copyright 2015, Prometheus Research, LLC
 */

import transit from 'transit-js';

/* istanbul ignore next */
let _readerConfig = {

  handlers: {},

  arrayBuilder: {
    init() {
      return [];
    },
    add(ret, val) {
      ret.push(val);
      return ret;
    },
    finalize(ret) {
      return ret;
    },
    fromArray(arr) {
      return arr;
    }
  },

  mapBuilder: {
    init() {
      return {};
    },
    add(ret, key, val) {
      ret[key] = val;
      return ret;
    },
    finalize(ret) {
      return ret;
    }
  }
};

/**
 * Decode transit payload into object model.
 */
/* istanbul ignore next */
export function decode(string) {
  let reader = transit.reader('json', _readerConfig);
  return reader.read(string);
}

/**
 * Register decode handler for a tag.
 */
/* istanbul ignore next */
export function register(tag, handler) {
  _readerConfig.handlers[tag] = handler;
}
