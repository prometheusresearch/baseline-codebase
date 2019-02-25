/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import merge from 'deeply';

import RexI18N from './i18n';


let CACHE = {};


export let DEFAULT_LOCALE = 'en';
export let DEFAULT_CONFIG = {};


/**
 * Sets the default locale to use for the current session in. Primarily useful
 * in the context of a browser, when using other functions in this module and
 * not passing them an explicit locale.
 *
 * @param {String} locale The locale to set.
 */
export function setDefaultLocale(locale) {
  DEFAULT_LOCALE = locale || 'en';
}


/**
 * Returns the default locale for the current session.
 *
 * @returns {String} The current default locale.
 */
export function getDefaultLocale() {
  return DEFAULT_LOCALE;
}


/**
 * Sets the default configuration to use when creating a new RexI18N instance
 * in the current session. The specified configuration completely replaces the
 * currently-defined configuration.
 *
 * @param {Object} config The configuration to set.
 */
export function setDefaultConfiguration(config) {
  DEFAULT_CONFIG = merge(config || {});
}


/**
 * Returns the default configuartion for the current session.
 *
 * @returns {Object} The current default configuration.
 */
export function getDefaultConfiguration() {
  return merge(DEFAULT_CONFIG);
}


/**
 * Updates the default configuration to use when creating a new RexI18N
 * instance in the current session. The specified configuration is merged into
 * the currently-defined configuration.
 *
 * @param {Object} config The configuration to merge.
 */
export function updateDefaultConfiguration(config) {
  DEFAULT_CONFIG = merge(getDefaultConfiguration(), config);
}


/**
 * A convenience method for creating a new instance of RexI18N.
 *
 * @param {Object} [options] The options to use when creating the instance. If
 *      not specified, the session default configuration is used.
 * @returns {RexI18N} A new instance of RexI18N.
 */
export function createInstance(options) {
  options = options || getDefaultConfiguration();
  return new RexI18N(options);
}


/**
 * Retrieves an instance of RexI18N for the specified locale from the cache. If
 * an instance does not yet exist, one is created.
 *
 * @param {String} [locale] The locale the RexI18N instance should be for. If
 *      not specified, the session default locale is used.
 * @returns {RexI18N} An instance of RexI18N for the locale.
 */
export function getInstance(locale, config) {
  locale = locale || getDefaultLocale();

  if (!CACHE[locale]) {
    let fullConfig = merge(
      getDefaultConfiguration(),
      config || {},
      {locale}
    );
    CACHE[locale] = createInstance(fullConfig);
    return CACHE[locale];

  } else {
    let instance = CACHE[locale];
    if (config && config.onLoad) {
      if (instance.isLoaded) {
        config.onLoad(instance);
      } else {
        if (instance.config.onLoad) {
          let previousOnLoad = instance.config.onLoad;
          instance.config.onLoad = (i18n, err) => {
            previousOnLoad(i18n, err);
            config.onLoad(i18n, err);
          };
        }
      }
    }
    return instance;
  }
}


/**
 * Primes the session cache with an instance of RexI18N for the specified
 * locale.
 *
 * @param {String} [locale] The locale the RexI18N instance should be created
 *      for. If not specified, the session default locale is used.
 */
export function preload(locale, config) {
  getInstance(locale, config);
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
export function onLoad(locale, func) {
  if (!func) {
    func = locale;
    locale = getDefaultLocale();
  }

  let instance = getInstance(locale);
  if (instance.isLoaded) {
    // The instance is already loaded, just execute the function.
    func(instance);
  } else {
    // Hasn't loaded yet, hook into the onLoad of the instance.
    if (instance.config.onLoad) {
      let previousOnLoad = instance.config.onLoad;
      instance.config.onLoad = (i18n, err) => {
        previousOnLoad(i18n, err);
        func(i18n, err);
      };
    } else {
      instance.config.onLoad = func;
    }
  }
}

