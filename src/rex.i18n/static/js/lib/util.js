'use strict';

var deepmerge = require('deepmerge');
var Promise = require('native-promise-only');


var ASYNC_DEFAULTS = {
  timeout: 10000
};


/**
 * A convenience function for performing asynchronous HTTP GETs.
 *
 * @param {Object} options An object containing the options to use.
 * @param {String} options.url The URL to invoke.
 * @param {Number} [options.timeout] The number of milliseconds to wait for the
 *    request to complete before giving up. If not specified, no timeout is set
 * @return {Promise} A Promise that is resolved when the GET has completed.
 */
var asyncGet = function (options) {
  return new Promise(function (resolve, reject) {
    options = deepmerge(ASYNC_DEFAULTS, options || {});

    if (!options.url) {
      reject(new Error('No URL specified for ajax()'));
      return;
    }

    var req = new global.XMLHttpRequest();

    req.onreadystatechange = function () {
      if (this.readyState === this.DONE) {
        if (this.status === 200) {
          var response = this.responseText;
          if (this.getResponseHeader('Content-type') === 'application/json') {
            try {
              response = JSON.parse(response);
              resolve(response);
            } catch (exc) {
              reject(exc);
            }
          }
          resolve(response);
        } else {
          reject(new Error(this.statusText || String(this.status)));
        }
      }
    };

    req.onerror = function(error) {
      reject(error);
    };

    if (options.timeout) {
      req.timeout = options.timeout;
      req.ontimeout = function (error) {
        reject(error);
      };
    }

    req.open('GET', options.url);
    req.send();
  });
};


module.exports = {
  asyncGet: asyncGet
};

