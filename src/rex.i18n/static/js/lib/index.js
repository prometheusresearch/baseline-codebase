/**
 * This module provides internationalization (I18N) functionality for
 * client-side JavaScript in RexDB applications.
 *
 * @module rex.i18n
 */

'use strict';


var Jed = require('jed');
var jstz = require('jstimezonedetect').jstz;
var globalize = require('globalize');


/**
 * This is a class that provides lazily-translated strings. This object does
 * its best to act like a String, but the value changes every time it is
 * evaluated based on the return value of the function you provide.
 *
 * @class LazyString
 * @constructor
 * @param {Function} func The function to call to retrieve/generate the actual
 *      string.
 */
var LazyString = function (func) {
    this.generator = func;
};

LazyString.prototype.toString = function () {
    return this.generator();
};

LazyString.prototype.valueOf = function () {
    return this.toString();
};


// Utility functions.

function ajax(url, onComplete, timeout, onTimeout) {
    var req = new global.XMLHttpRequest();
    req.onreadystatechange = function () {
        if (this.readyState === this.DONE) {
            onComplete.call(this);
        }
    };
    if (timeout && onTimeout) {
        req.timeout = timeout;
        req.ontimeout = onTimeout;
    }
    req.open('GET', url);
    req.send();
}


function log(message) {
    if (global.console && (typeof global.console.log === 'function')) {
        global.console.log(message);
    }
}


// Jed utility properties/functions.

var DEFAULT_JED = new Jed({
    domain: 'unknown',
    locale_data: {
        'unknown': {
            '': {
                domain: 'unknown',
                lang: 'en',
                plural_forms: "nplurals=2; plural=(n != 1);"
            }
        }
    }
});


// Globalize utility properties/functions.

var GLOBALIZE_ISO_FORMAT = {
    date: 'yyyy-MM-dd',
    datetime: 'yyyy-MM-ddTHH:mm:ssZZ',
    time: 'HH:mm:ssZZ'
};

var GLOBALIZE_LOADED_COMPONENTS = {};

function loadGlobalizeComponents(component) {
    if (this.status === 200) {
        try {
            var i,
                components = JSON.parse(this.responseText);
            for (i = 0; i < components.length; i += 1) {
                globalize.load(components[i]);
            }

            GLOBALIZE_LOADED_COMPONENTS[component] = true;
        } catch (exc) {
            log('Could not parse locale components: ' + exc.toString());
            GLOBALIZE_LOADED_COMPONENTS[component] = false;
        }
    } else {
        log('Could not retrieve locale components: ' + this.statusText);
        GLOBALIZE_LOADED_COMPONENTS[component] = false;
    }
}

function globalizeLoaded(locale) {
    return (
        (GLOBALIZE_LOADED_COMPONENTS.common === true)
        && (GLOBALIZE_LOADED_COMPONENTS[locale] === true)
    );
}

function getGlobalizeDateTimeFormat(funcName, format) {
    format = format || 'medium';

    if ((format === 'short') || (format === 'medium') || (format === 'long') || (format === 'full')) {
        var ret = {};
        ret[funcName] = format;
        return ret;
    }

    if (format === 'iso') {
        return { pattern: GLOBALIZE_ISO_FORMAT[funcName] };
    }

    return { pattern: format };
}


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
 * @param {String} [options.translationsBaseUrl='/translations'] The base URL
 *      to retrieve the translations to use for gettext, etc.
 * @param {String} [options.localeBaseUrl='/locale'] The base URL to retrieve
 *      the locale information needed for the date and numerical methods.
 * @param {Integer} [options.timeout=10000] The number of milliseconds to use
 *      as a timeout value when retrieving translations, etc from the server.
 *      Note: Timeout functionality is not supported by all browsers.
 */
var RexI18N = function (options) {
    var self = this,
        jed,
        found,
        tz,
        defaults = {
            locale: 'en',
            timezone: null,
            translationsBaseUrl: '/translations',
            localeBaseUrl: '/locale',
            timeout: 10000
        };


    /**
     * The configuration used for instance of the localization class.
     *
     * @property config
     * @type Object
     */
    options = options || {};
    this.config = {
        locale: options.locale || defaults.locale,
        timezone: options.timezone || defaults.timezone,
        translationsBaseUrl: options.translationsBaseUrl || defaults.translationsBaseUrl,
        localeBaseUrl: options.localeBaseUrl || defaults.localeBaseUrl,
        timeout: options.timeout || defaults.timeout
    };


    // Initialize the config.
    if (!this.config.timezone) {
        // No timezone specified, let's figure it out ourselves.
        try {
            this.config.timezone = jstz.determine().name();
        } catch (exc) {
            log('Could not determine timezone: ' + exc.toString());
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
            throw new Error('Invalid timezone specified (' + this.config.timezone + ')');
        }
    }


    // Initialize Jed.
    ajax(
        this.config.translationsBaseUrl + '/' + this.config.locale,
        function () {
            if (this.status === 200) {
                try {
                    var data = JSON.parse(this.responseText);
                    jed = new Jed({
                        domain: 'frontend',
                        locale_data: data
                    });
                } catch (exc) {
                    log('Could not parse translations: ' + exc.toString());
                    jed = DEFAULT_JED;
                }
            } else {
                log('Could not retrieve translations: ' + this.statusText);
                jed = DEFAULT_JED;
            }
        },
        this.config.timeout,
        function () {
            log('Timed out when retrieving translations');
            jed = DEFAULT_JED;
        }
    );


    // Initialize Globalize.
    if (GLOBALIZE_LOADED_COMPONENTS.common === undefined) {
        ajax(
            this.config.localeBaseUrl,
            function () {
                loadGlobalizeComponents.call(this, 'common');
            },
            this.config.timeout,
            function () {
                log('Timed out when retrieving locale components');
            }
        );
    }
    if (GLOBALIZE_LOADED_COMPONENTS[this.config.locale] === undefined) {
        (function () {
            var locale = this.config.locale;
            ajax(
                this.config.localeBaseUrl + '/' + locale,
                function () {
                    loadGlobalizeComponents.call(this, locale);
                },
                this.config.timeout,
                function () {
                    log('Timed out when retrieving locale components');
                }
            );
        }).call(this);
    }


    /**
     * Return the localized translation of the key, optionally substituting
     * the specified variables.
     *
     * @method gettext
     * @param {String} key The key of the message to retrieve.
     * @param {Object} [variables] An object containing the variables to
     *      substitute into the translated message.
     * @return {String|LazyString} The translated messages. If the translations
     *      have not finished loading into RexI18N, then this method will
     *      return a LazyString, which, when rendered at a later time, will
     *      display the translated string.
     */
    this.gettext = function (key, variables, translator) {
        if (!variables) {
            variables = {};
        }

        translator = translator || jed;

        if (!translator) {
            return new LazyString(function () {
                return self.gettext(
                    key,
                    variables,
                    jed || DEFAULT_JED
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
    this.ngettext = function (key, pluralKey, num, variables, translator) {
        if (!variables) {
            variables = {};
        }

        translator = translator || jed;

        if (!translator) {
            return new LazyString(function () {
                return self.ngettext(
                    key,
                    pluralKey,
                    num,
                    variables,
                    jed || DEFAULT_JED
                );
            });
        }

        var value = translator.ngettext(key, pluralKey, num);
        variables.num = num;
        value = translator.sprintf(value, variables);
        return value;
    };


    this.internalDateFormatter = function (formatClass, date, format, timezone) {
        // TODO: Normalize/Assume date is UTC and format to specified TZ
        format = getGlobalizeDateTimeFormat(formatClass, format);
        timezone = timezone || this.config.timezone;
        var locale = this.config.locale;

        if (!globalizeLoaded(locale)) {
            return new LazyString(function () {
                if (!globalizeLoaded(locale)) {
                    switch (formatClass) {
                    case 'date':
                        return date.toDateString();
                    case 'time':
                        return date.toTimeString();
                    default:
                        return date.toString();
                    }
                }
                return globalize.formatDate(date, format, locale);
            });
        }

        return globalize.formatDate(date, format, locale);
    };


    /**
     * Formats a Date object into a the specified localized format for a date.
     *
     * @method formatDate
     * @param {Date} date The Date object to format. It is assumed to represent
     *      a date/time in the UTC timezone.
     * @param {String} [format='medium'] The format to render the Date to. You
     *      can specify "short", "medium", "long", "full", "iso", or a raw date
     *      pattern as allowed by:
     *      http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     * @param {String} [timezone] The IANA Timezone to render the date in. If
     *      not specified, it defaults to the current configuration.
     * @return {String} The formatted date string.
     */
    this.formatDate = function (date, format, timezone) {
        return this.internalDateFormatter('date', date, format, timezone);
    };


    /**
     * Formats a Date object into a the specified localized format for a
     * date/time.
     *
     * @method formatDatetime
     * @param {Date} date The Date object to format. It is assumed to represent
     *      a date/time in the UTC timezone.
     * @param {String} [format='medium'] The format to render the Date to. You
     *      can specify "short", "medium", "long", "full", "iso", or a raw
     *      date/time pattern as allowed by:
     *      http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     * @param {String} [timezone] The IANA Timezone to render the date in. If
     *      not specified, it defaults to the current configuration.
     * @return {String} The formatted date/time string.
     */
    this.formatDateTime = function (date, format, timezone) {
        return this.internalDateFormatter('datetime', date, format, timezone);
    };


    /**
     * Formats a Date object into a the specified localized format for a time.
     *
     * @method formatTime
     * @param {Date} date The Date object to format. It is assumed to represent
     *      a date/time in the UTC timezone.
     * @param {String} [format='medium'] The format to render the Date to. You
     *      can specify "short", "medium", "long", "full", "iso", or a raw time
     *      pattern as allowed by:
     *      http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     *      If nothing is specified, this parameter defaults to "medium".
     * @param {String} [timezone] The IANA Timezone to render the date in. If
     *      not specified, it defaults to the current configuration.
     * @return {String} The formatted time string.
     */
    this.formatTime = function (date, format, timezone) {
        return this.internalDateFormatter('time', date, format, timezone);
    };


    /**
     * Formats a number to a localized string as specified by the formatting
     * options.
     *
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
    this.formatNumber = function (number, format) {
        format = format || { style: 'decimal' };
        var locale = this.config.locale;

        if (!globalizeLoaded(locale)) {
            return new LazyString(function () {
                if (!globalizeLoaded(locale)) {
                    return number.toString();
                }
                return globalize.formatNumber(number, format, locale);
            });
        }

        return globalize.formatNumber(number, format, locale);
    };


    /**
     * Formats a number to a general localized numerical string.
     *
     * @method formatDecimal
     * @param {Number} number The number to format.
     * @return {String} The formatted numerical string.
     */
    this.formatDecimal = function (number) {
        return this.formatNumber(number, { style: 'decimal' }, this.config.locale);
    };


    /**
     * Formats a number to a localized percentage string.
     *
     * @method formatPercent
     * @param {Number} number The number to format.
     * @return {String} The formatted numerical string.
     */
    this.formatPercent = function (number) {
        return this.formatNumber(number, { style: 'percent' }, this.config.locale);
    };


    /**
     * Formats a number to a localized scientific-notation string.
     *
     * @method formatScientific
     * @param {Number} number The number to format.
     * @return {String} The formatted numerical string.
     */
    this.formatScientific = function (number) {
        // TODO: Uncomment when Globalize adds "scientific" style
        //return this.formatNumber(number, { style: 'scientific' }, this.config.locale);
        throw new Error('Not Implemented Yet');
    };


    /**
     * Formats a number to a localized numerical string representing currency.
     *
     * @method formatScientific
     * @param {Number} number The number to format.
     * @param {String} currency The currency the number is measuring.
     * @return {String} The formatted numerical string.
     */
    this.formatCurrency = function (number, currency) {
        // TODO: Implement when Globalize adds currency formatting support
        throw new Error('Not Implemented Yet');
    };

};


// Export our public interface.
module.exports = {
    RexI18N: RexI18N,
    LazyString: LazyString
};

global.Rex = global.Rex || {};
global.Rex.I18N = module.exports;

