/**
 * @copyright 2015 Prometheus Research, LLC
 */

import assert from 'power-assert';
import jsdom  from 'jsdom';

let document = jsdom.jsdom('<!doctype html><html><body></body></html>');
let window = document.defaultView;

global.assert = assert;
global.document = document;
global.window = window;
global.__PUBLIC_PATH__ = '/';
global.__REX_USER__ = 'rex-user';
global.requestAnimationFrame = function(callback) {
  setTimeout(callback, 0);
}

propagateToGlobal(window);

function propagateToGlobal(window) {
  for (let key in window) {
    if (!window.hasOwnProperty(key)) {
      continue;
    }
    if (key in global) {
      continue;
    }
    global[key] = window[key];
  }
}

require.extensions['.gif'] = function() {
  return 'url';
};

require.extensions['.css'] = function() {
  return 'css-url';
};
