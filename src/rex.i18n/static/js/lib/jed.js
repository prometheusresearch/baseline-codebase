'use strict';


var Jed = require('jed');

var util = require('./util');


var DEFAULT = new Jed({
  'domain': 'unknown',
  'locale_data': {
    'unknown': {
      '': {
        'domain': 'unknown',
        'lang': 'en',
        'plural_forms': 'nplurals=2; plural=(n != 1);'
      }
    }
  }
});


var CACHE = {};


var getTranslationsUrl = function (baseUrl, locale) {
  var txUrl = baseUrl;
  if (txUrl.substr(-1, 1) !== '/') {
    txUrl += '/';
  }
  txUrl += locale;

  return txUrl;
};


var retrieveTranslations = function (translationsUrl) {
  return util.asyncGet({
    url: translationsUrl
  }).then(
    function (result) {
      return new Jed({
        'domain': 'frontend',
        'locale_data': result
      });
    }
  );
};


var retrieve = function (baseUrl, locale, forceRecache) {
  var txUrl = getTranslationsUrl(baseUrl, locale);

  return new Promise(function (resolve) {
    if ((CACHE[txUrl] === undefined) || forceRecache) {
      // We need to retrieve the translations from the server.
      retrieveTranslations(txUrl).then(
        function (result) {
          // Success; cache and return it.
          CACHE[txUrl] = result;
          resolve(result);
        },

        function () {
          // Failure; mark it as so then return the default.
          CACHE[txUrl] = false;
          resolve(DEFAULT);
        }
      );

    } else if (CACHE[txUrl] === false) {
      resolve(DEFAULT);

    } else {
      resolve(CACHE[txUrl]);

    }
  });
};


module.exports = {
  retrieve: retrieve,
  DEFAULT: DEFAULT
};

