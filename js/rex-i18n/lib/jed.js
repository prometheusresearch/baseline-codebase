/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */

import Jed from 'jed';

import {getJson} from './util';


export let DEFAULT = new Jed({
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


let CACHE = {};


function getTranslationsUrl(baseUrl, locale) {
  let txUrl = baseUrl;
  if (txUrl.substr(-1, 1) !== '/') {
    txUrl += '/';
  }
  txUrl += locale;

  return txUrl;
}


function retrieveTranslations(translationsUrl) {
  return getJson(translationsUrl).then((result) => {
    return new Jed({
      'domain': 'frontend',
      'locale_data': result
    });
  });
}


export function retrieve(baseUrl, locale, forceRecache = false) {
  let txUrl = getTranslationsUrl(baseUrl, locale);

  return new Promise((resolve) => {
    if ((CACHE[txUrl] === undefined) || forceRecache) {
      // We need to retrieve the translations from the server.
      retrieveTranslations(txUrl).then(
        (result) => {
          // Success; cache and return it.
          CACHE[txUrl] = result;
          resolve(result);
        },

        () => {
          // Failure; mark it as so, then return the default.
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
}

