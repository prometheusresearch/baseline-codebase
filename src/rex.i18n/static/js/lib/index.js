'use strict';


var LazyString = require('./lazystring').LazyString;
var RexI18N = require('./i18n').RexI18N;
var deepmerge = require('deepmerge');


global.Rex = global.Rex || {};

var DEFAULT_LOCALE = global.Rex.I18N_DEFAULT_LOCALE || 'en';
var DEFAULT_CONFIG = global.Rex.I18N_DEFAULT_CONFIG || {};
var CACHE = {};


/**
 * Sets the default locale to use for the current session in. Primarily useful
 * in the context of a browser, when using other functions in this module and
 * not passing them an explicit locale.
 *
 * @param {String} locale The locale to set.
 */
function setDefaultLocale(locale) {
  DEFAULT_LOCALE = locale || 'en';
}


/**
 * Returns the default locale for the current session.
 *
 * @returns {String} The current default locale.
 */
function getDefaultLocale() {
  return DEFAULT_LOCALE;
}


/**
 * Sets the default configuration to use when creating a new RexI18N instance
 * in the current session. The specified configuration completely replaces the
 * currently-defined configuration.
 *
 * @param {Object} config The configuration to set.
 */
function setDefaultConfiguration(config) {
  DEFAULT_CONFIG = deepmerge({}, config || {});
}


/**
 * Returns the default configuartion for the current session.
 *
 * @returns {Object} The current default configuration.
 */
function getDefaultConfiguration() {
  return deepmerge(DEFAULT_CONFIG, {});
}


/**
 * Updates the default configuration to use when creating a new RexI18N
 * instance in the current session. The specified configuration is merged into
 * the currently-defined configuration.
 *
 * @param {Object} config The configuration to merge.
 */
function updateDefaultConfiguration(config) {
  DEFAULT_CONFIG = deepmerge(getDefaultConfiguration(), config || {});
}


/**
 * A convenience method for creating a new instance of RexI18N.
 *
 * @param {Object} [options] The options to use when creating the instance. If
 *      not specified, the session default configuration is used.
 * @returns {RexI18N} A new instance of RexI18N.
 */
function createInstance(options) {
  var ri = new RexI18N(options);
  CACHE[options.locale] = ri;
  return ri;
}


/**
 * Retrieves an instance of RexI18N for the specified locale from the cache. If
 * an instance does not yet exist, one is created.
 *
 * @param {String} [locale] The locale the RexI18N instance should be for. If
 *      not specified, the session default locale is used.
 * @returns {RexI18N} An instance of RexI18N for the locale.
 */
function getInstance(locale) {
  locale = locale || getDefaultLocale();

  if (!CACHE[locale]) {
    var config = deepmerge(getDefaultConfiguration(), {locale: locale});
    createInstance(config);
  }

  return CACHE[locale];
}


/**
 * Primes the session cache with an instance of RexI18N for the specified
 * locale.
 *
 * @param {String} [locale] The locale the RexI18N instance should be created
 *      for. If not specified, the session default locale is used.
 */
function preload(locale) {
  getInstance(locale);
}


/**
 * Registers a function to be called once the RexI18N instance for the given
 * locale has finished loading.
 *
 * @param {String} [locale] The locale the function should be associated with.
 *      If not specified, the session default locale is used.
 * @param {Function} func The function to execute when the RexI18N has finished
 *      loading. The arguments passed to the function are the same as those
 *      passed to the onLoad callback in the RexI18N configuration; the first
 *      is the RexI18N instance, and the second is the error that occurred, if
 *      any.
 */
function onLoad(locale, func) {
  if (!func) {
    func = locale;
    locale = getDefaultLocale();
  }

  var instance = getInstance(locale);
  if (instance.isLoaded) {
    // The instance is already loaded, just execute the function.
    func(instance);
  } else {
    // Hasn't loaded yet, hook into the onLoad of the instance.
    var previousOnLoad = instance.config.onLoad;
    instance.config.onLoad = function (i18n, err) {
      previousOnLoad(i18n, err);
      func(i18n, err);
    };
  }
}


module.exports = {
  LazyString: LazyString,
  RexI18N: RexI18N,

  createInstance: createInstance,
  getInstance: getInstance,
  preload: preload,
  onLoad: onLoad,

  setDefaultLocale: setDefaultLocale,
  getDefaultLocale: getDefaultLocale,
  setDefaultConfiguration: setDefaultConfiguration,
  updateDefaultConfiguration: updateDefaultConfiguration,
  getDefaultConfiguration: getDefaultConfiguration
};

global.Rex.I18N = module.exports;

