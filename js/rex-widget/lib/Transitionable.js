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

export function extractPackageNames(s) {
  let pkgs = {};
  s.replace(/"@js-package::([^"]+)"/g, (_, p) => {
    pkgs[p] = true;
  });
  return Object.keys(pkgs);
}

let packageResolver = null;
export function registerPackageResolver(f) {
  packageResolver = f;
}

let cachedPackages = {};
export function resolvePackage(pkgName) {
  if (cachedPackages[pkgName]) return Promise.resolve(cachedPackages[pkgName]);
  else {
    if (!packageResolver) {
      throw new Error(
        "Package resolver is not registered. Use 'registerPackageResolver'",
      );
    }
    let resolved = packageResolver(pkgName);
    if(!(resolved instanceof Promise)) {
      throw new Error(`Cannot resolve package: ${pkgName}`);
    }
    return resolved.then(p => {
      cachedPackages[pkgName] = p;
      return p;
    });
  }
}

export function ensurePackages(packages) {
  return Promise.all(packages.map(resolvePackage));
}

export function __require__(pkgName) {
  if(!cachedPackages[pkgName]) {
    throw new Error(`__require__("${pkgName}") failed.`);
  }
  return cachedPackages[pkgName];
};
