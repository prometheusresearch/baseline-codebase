'use strict';


var Globalize = require('globalize');
var Promise = require('bluebird');

var util = require('./util');


var ISO_FORMATS = {
  date: 'yyyy-MM-dd',
  datetime: 'yyyy-MM-ddTHH:mm:ssZZ',
  time: 'HH:mm:ssZZ'
};


var getDateTimeFormat = function(funcName, format) {
  format = format || 'medium';

  if (
      (format === 'short') ||
      (format === 'medium') ||
      (format === 'long') ||
      (format === 'full')) {
    var ret = {};
    ret[funcName] = format;
    return ret;
  }

  if (format === 'iso') {
    return { pattern: ISO_FORMATS[funcName] };
  }

  return { pattern: format };
};


var CACHE = {};
var _COMMON_LOADED = false;


var getLocaleUrl = function (baseUrl, locale) {
  var locUrl = baseUrl;
  if (locUrl.substr(-1, 1) !== '/') {
    locUrl += '/';
  }
  locUrl += locale;

  return locUrl;
};


var retrieveComponents = function (url) {
  return util.asyncGet({
    url: url
  }).then(
    function (result) {
      for (var i = 0; i < result.length; i += 1) {
        Globalize.load(result[i]);
      }
      return result.length;
    }
  );
};


var retrieveCommon = function (baseUrl) {
  return new Promise(function (resolve, reject) {
    if (_COMMON_LOADED) {
      // If we've already done it, then immediately resolve.
      resolve(true);

    } else {
      // Otherwise, retrieve the data from the server.
      retrieveComponents(baseUrl).then(
        function () {
          _COMMON_LOADED = true;
          resolve(true);
        },

        function (error) {
          reject(error);
        }
      );
    }
  });
};


var retrieveLocale = function (baseUrl, locale) {
  var locUrl = getLocaleUrl(baseUrl, locale);
  return retrieveComponents(locUrl);
};


var retrieve = function (baseUrl, locale, forceRecache) {
  var locUrl = getLocaleUrl(baseUrl, locale);

  return new Promise(function (resolve, reject) {
    if ((CACHE[locUrl] === undefined) || forceRecache) {
      return Promise.all([
        retrieveCommon(baseUrl),
        retrieveLocale(baseUrl, locale)
      ]).then(
        function () {
          var instance = new Globalize(locale);
          CACHE[locUrl] = instance;
          resolve(instance);
        },

        function (error) {
          CACHE[locUrl] = false;
          reject(new Error(error));
        }
      );

    } else if (CACHE[locUrl] === false) {
      reject(new Error(
        'The previous attempt to retrieve locale "' + locale + '" failed.'
      ));

    } else {
      resolve(CACHE[locUrl]);

    }
  });
};


module.exports = {
  retrieve: retrieve,
  getDateTimeFormat: getDateTimeFormat
};

