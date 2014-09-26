'use strict';


var jstz = require('jstimezonedetect').jstz;
var Promise = require('es6-promise-polyfill').Promise;
var deepmerge = require('deepmerge');

var JedWrapper = require('./jed');
var GlobalizeWrapper = require('./globalize');
var LazyString = require('./lazystring').LazyString;


/**
 * This class provides I18N functionality for client-side JavaScript
 * applications.
 *
 * @class RexI18N
 * @constructor
 * @param {Object} [options] An object containing the options to use.
 * @param {String} [options.locale='en'] The locale to use in translations and
 *      formatting.
 * @param {String} [options.timezone='UTC'] The timezone to use in date
 *      formatting. If not specified, an attempt will be made to detect it.
 * @param {String} [options.baseUrl='/i18n'] The base URL that the
 *      translationsUrl and localeUrl are appended to in order to retrieve
 *      the relevant I18N information.
 * @param {String} [options.translationsUrl='/translations'] The base URL
 *      to retrieve the translations to use for gettext, etc.
 * @param {String} [options.localeUrl='/locale'] The base URL to retrieve
 *      the locale information needed for the date and numerical methods.
 * @param {Integer} [options.timeout=10000] The number of milliseconds to use
 *      as a timeout value when retrieving translations, etc from the server.
 *      Note: Timeout functionality is not supported by all browsers.
 * @param {Function} [options.onLoad] The function to call once RexI18N has
 *      finished loading its necessary components. The first argument to the
 *      function will contain the new RexI18N instance. The second argument
 *      will contain the error that occurred during loading, if any did.
 */
var RexI18N = function (options) {
  if (!(this instanceof RexI18N)) {
    return new RexI18N(options);
  }

  var self = this,
    found,
    tz,
    defaults = {
      locale: 'en',
      timezone: null,
      baseUrl: '/i18n',
      translationsUrl: '/translations',
      localeUrl: '/locale',
      timeout: 10000,
      onLoad: function () {}
    };

  /**
   * The configuration used for this instance of the localization class.
   *
   * @class RexI18N
   * @property config
   * @type Object
   */
  this.config = deepmerge(defaults, options || {});

  /**
   * Indicates whether or not this instance has completed loading its data.
   *
   * @class RexI18N
   * @property isLoaded
   * @type Boolean
   */
  this.isLoaded = false;

  // Initialize the config.
  if (!this.config.timezone) {
    // No timezone specified, let's figure it out ourselves.
    try {
      this.config.timezone = jstz.determine().name();
    } catch (exc) {
      this.config.timezone = 'UTC';
    }
  } else {
    // Timezone specified; validate it.
    found = false;
    for (tz in jstz.olson.timezones) {
      if (jstz.olson.timezones[tz] === this.config.timezone) {
        found = true;
        break;
      }
    }
    if (!found) {
      throw new Error(
        'Invalid timezone specified (' + this.config.timezone + ')'
      );
    }
  }

  // Initialize Jed.
  var jedPromise = JedWrapper.retrieve(
    this.config.baseUrl + this.config.translationsUrl,
    this.config.locale
  ).then(
    function (jed) {
      self.jed = jed;
    }
  );

  // Initialize Globalize.
  var globalizePromise = GlobalizeWrapper.retrieve(
    this.config.baseUrl + this.config.localeUrl,
    this.config.locale
  ).then(
    function (globalize) {
      self.globalize = globalize;
    }
  );

  Promise.all([
    jedPromise,
    globalizePromise
  ]).then(
    function () {
      self.isLoaded = true;
      self.config.onLoad(self);
    },
    function (error) {
      self.isLoaded = true;
      self.config.onLoad(self, error);
    }
  );
};


/**
 * Return the localized translation of the key, optionally substituting
 * the specified variables.
 *
 * @class RexI18N
 * @method gettext
 * @param {String} key The key of the message to retrieve.
 * @param {Object} [variables] An object containing the variables to
 *      substitute into the translated message.
 * @return {String|LazyString} The translated messages. If the translations
 *      have not finished loading into RexI18N, then this method will
 *      return a LazyString, which, when rendered at a later time, will
 *      display the translated string.
 */
RexI18N.prototype.gettext = function (key, variables, translator) {
  if (!variables) {
    variables = {};
  }

  translator = translator || this.jed;

  if (!translator) {
    var self = this;

    return new LazyString(function () {
      return self.gettext(
        key,
        variables,
        self.jed || JedWrapper.DEFAULT
      );
    });
  }

  var value = translator.gettext(key);
  value = translator.sprintf(value, variables);
  return value;
};


/**
 * Functions exactly like gettext(), but considers plural forms of the
 * message based on the locale's evalution of the specified numeric
 * quantity.
 *
 * @class RexI18N
 * @method gettext
 * @param {String} key The key of the message to retrieve.
 * @param {String} pluralKey The plural key of the message to retreive.
 * @param {Number} num The quantity to base the decision of plurality on
 * @param {Object} [variables] An object containing the variables to
 *      substitute into the translated message. A variable of "num" is
 *      automatically inserted into this object prior to evalution with the
 *      value that is passed in the "num" parameter of this function.
 * @return {String|LazyString} The translated messages. If the translations
 *      have not finished loading into RexI18N, then this method will
 *      return a LazyString, which, when rendered at a later time, will
 *      display the translated string.
 */
RexI18N.prototype.ngettext = function (
    key,
    pluralKey,
    num,
    variables,
    translator) {

  if (!variables) {
    variables = {};
  }

  translator = translator || this.jed;

  if (!translator) {
    var self = this;
    return new LazyString(function () {
      return self.ngettext(
        key,
        pluralKey,
        num,
        variables,
        self.jed || JedWrapper.DEFAULT
      );
    });
  }

  var value = translator.ngettext(key, pluralKey, num);
  variables.num = num;
  value = translator.sprintf(value, variables);
  return value;
};


RexI18N.prototype._internalDateFormatter = function (
    formatClass,
    date,
    format,
    timezone) {

  // TODO: Normalize/Assume date is UTC and format to specified TZ

  format = GlobalizeWrapper.getDateTimeFormat(formatClass, format);
  timezone = timezone || this.config.timezone;

  if (!this.globalize) {
    var self = this;
    return new LazyString(function () {
      if (!self.globalize) {
        switch (formatClass) {
          case 'date':
            if (date.toLocaleDateString) {
              return date.toLocaleDateString();
            }
            return date.toDateString();

          case 'time':
            if (date.toLocaleTimeString) {
              return date.toLocaleTimeString();
            }
            return date.toTimeString();

          default:
            if (date.toLocaleString) {
              return date.toLocaleString();
            }
            return date.toString();
        }   
      }
      return self.globalize.formatDate(date, format);
    });
  }

  return this.globalize.formatDate(date, format);
};


/**
 * Formats a Date object into a the specified localized format for a date.
 *
 * @class RexI18N
 * @method formatDate
 * @param {Date} date The Date object to format. It is assumed to represent
 *      a date/time in the UTC timezone.
 * @param {String} [format='medium'] The format to render the Date to. You
 *      can specify "short", "medium", "long", "full", "iso", or a raw date
 *      pattern as allowed by the Date Field Symbol Table found here:
 *      http://www.unicode.org/reports/tr35/tr35-dates.html
 * @param {String} [timezone] The IANA Timezone to render the date in. If
 *      not specified, it defaults to the current configuration.
 * @return {String} The formatted date string.
 */
RexI18N.prototype.formatDate = function (date, format, timezone) {
  return this._internalDateFormatter('date', date, format, timezone);
};


/**
 * Formats a Date object into a the specified localized format for a
 * date/time.
 *
 * @class RexI18N
 * @method formatDatetime
 * @param {Date} date The Date object to format. It is assumed to represent
 *      a date/time in the UTC timezone.
 * @param {String} [format='medium'] The format to render the Date to. You
 *      can specify "short", "medium", "long", "full", "iso", or a raw
 *      pattern as allowed by the Date Field Symbol Table found here:
 *      http://www.unicode.org/reports/tr35/tr35-dates.html
 * @param {String} [timezone] The IANA Timezone to render the date in. If
 *      not specified, it defaults to the current configuration.
 * @return {String} The formatted date/time string.
 */
RexI18N.prototype.formatDateTime = function (date, format, timezone) {
  return this._internalDateFormatter('datetime', date, format, timezone);
};


/**
 * Formats a Date object into a the specified localized format for a time.
 *
 * @class RexI18N
 * @method formatTime
 * @param {Date} date The Date object to format. It is assumed to represent
 *      a date/time in the UTC timezone.
 * @param {String} [format='medium'] The format to render the Date to. You
 *      can specify "short", "medium", "long", "full", "iso", or a raw time
 *      pattern as allowed by the Date Field Symbol Table found here:
 *      http://www.unicode.org/reports/tr35/tr35-dates.html
 *      If nothing is specified, this parameter defaults to "medium".
 * @param {String} [timezone] The IANA Timezone to render the date in. If
 *      not specified, it defaults to the current configuration.
 * @return {String} The formatted time string.
 */
RexI18N.prototype.formatTime = function (date, format, timezone) {
  return this._internalDateFormatter('time', date, format, timezone);
};


/**
 * Formats a number to a localized string as specified by the formatting
 * options.
 *
 * @class RexI18N
 * @method formatNumber
 * @param {Number} number The number to format.
 * @param {Object} [format] The formatting options to use when rendering
 *      the Number. You can use any option allowed by the attributes
 *      parameter of the Globalize.formatNumber method:
 *      https://github.com/jquery/globalize#format_number
 *      If not specified, will default to the same options as used by the
 *      formatDecimal method.
 * @return {String} The formatted numerical string.
 */
RexI18N.prototype.formatNumber = function (number, format) {
  format = format || { style: 'decimal' };

  if (!this.globalize) {
    var self = this;
    return new LazyString(function () {
      if (!self.globalize) {
        if (number.toLocaleString) {
          return number.toLocaleString();
        }
        return number.toString();
      }
      return self.globalize.formatNumber(number, format);
    });
  }

  return this.globalize.formatNumber(number, format);
};


/**
 * Formats a number to a general localized numerical string.
 *
 * @class RexI18N
 * @method formatDecimal
 * @param {Number} number The number to format.
 * @return {String} The formatted numerical string.
 */
RexI18N.prototype.formatDecimal = function (number) {
  return this.formatNumber(number, { style: 'decimal' }, this.config.locale);
};


/**
 * Formats a number to a localized percentage string.
 *
 * @class RexI18N
 * @method formatPercent
 * @param {Number} number The number to format.
 * @return {String} The formatted numerical string.
 */
RexI18N.prototype.formatPercent = function (number) {
  return this.formatNumber(number, { style: 'percent' }, this.config.locale);
};


/**
 * Formats a number to a localized scientific-notation string.
 *
 * @class RexI18N
 * @method formatScientific
 * @param {Number} number The number to format.
 * @return {String} The formatted numerical string.
 */
RexI18N.prototype.formatScientific = function (number) {
  // TODO: Uncomment when Globalize adds "scientific" style
  //return this.formatNumber(
  //  number,
  //  { style: 'scientific' },
  //  this.config.locale
  //);
  throw new Error('Not Implemented Yet');
};


/**
 * Formats a number to a localized numerical string representing currency.
 *
 * @class RexI18N
 * @method formatScientific
 * @param {Number} number The number to format.
 * @param {String} currency The currency the number is measuring.
 * @return {String} The formatted numerical string.
 */
RexI18N.prototype.formatCurrency = function (number, currency) {
  // TODO: Implement when Globalize adds currency formatting support
  throw new Error('Not Implemented Yet');
};


module.exports = {
  RexI18N: RexI18N
};

