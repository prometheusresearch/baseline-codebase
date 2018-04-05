/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import autobind from 'autobind-decorator';
import formatCache from 'intl-format-cache';
import * as moment from 'moment-timezone';
import merge from 'deeply';

import * as JedWrapper from './jed';


let RTL_LOCALES = [
  'ar',
  'fa',
  'ps',
  'he',
  'ur'
];


let DEFAULT_OPTIONS = {
  locale: 'en',
  timezone: null,
  baseUrl: '/i18n',
  translationsUrl: '/translations',
  onLoad: null
};


let DATETIME_FORMATS = {
  DATETIME: {
    'short': {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    },
    'medium': {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    },
    'long': {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    },
    'full': {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }
  },

  DATE: {
    'short': {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    },
    'medium': {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    },
    'long': {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    'full': {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  },

  TIME: {
    'short': {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    },
    'medium': {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    },
    'long': {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    },
    'full': {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }
  }
};


class I18N {
  constructor(options = {}) {
    this.isLoaded = false;

    // Initialize the Intl tools.
    this._getNumberFormat = formatCache(Intl.NumberFormat);
    this._getDateTimeFormat = formatCache(Intl.DateTimeFormat);

    // Initialize the config.
    this.config = merge(DEFAULT_OPTIONS, options);
    if (!this.config.timezone) {
      // No timezone specified, let's figure it out ourselves.
      this.config.timezone = moment.tz.guess() || 'UTC';
    } else {
      let zone = moment.tz.zone(this.config.timezone);
      if (!zone) {
        throw new Error(
          'Invalid timezone specified (' + this.config.timezone + ')'
        );
      }
    }
    if (this.config.baseUrl.endsWith('/')) {
      this.config.baseUrl = this.config.baseUrl.substr(
        0,
        this.config.baseUrl.length - 1
      );
    }

    // Check if we can support timezones.
    this._TZ_SUPPORT = !global.IntlPolyfill;  // Intl.js doesn't support them.
    try {
      this._getDateTimeFormat(
        this.config.locale,
        {timeZone: this.config.timezone}
      );
    } catch (exc) {
      if (exc instanceof RangeError) {
        // This exception means the browsers Intl implementation doesn't
        // support timezones.
        this._TZ_SUPPORT = false;
      } else {
        throw exc;
      }
    }

    // Initialize Jed.
    let jedPromise = JedWrapper.retrieve(
      this.config.baseUrl + this.config.translationsUrl,
      this.config.locale
    ).then((jed) => {
      this.jed = jed;
    });

    // Fire events when everything's loaded.
    jedPromise.then(
      () => {
        this.isLoaded = true;
        if (this.config.onLoad) {
          this.config.onLoad(this);
        }
      },
      (error) => {
        this.isLoaded = true;
        if (this.config.onLoad) {
          this.config.onLoad(this, error);
        }
      }
    );
  }

  getLanguage() {
    return this.config.locale.split(/[\-_]/, 1);
  }

  isRightToLeft() {
    return RTL_LOCALES.indexOf(this.config.locale.substring(0, 2)) > -1;
  }

  gettext(key, variables = {}, translator) {
    translator = translator || this.jed || JedWrapper.DEFAULT;
    let value = translator.gettext(key);
    value = translator.sprintf(value, variables);
    return value;
  }

  ngettext(key, pluralKey, num, variables = {}, translator) {
    translator = translator || this.jed || JedWrapper.DEFAULT;
    let value = translator.ngettext(key, pluralKey, num);
    variables = merge(variables, {num});
    value = translator.sprintf(value, variables);
    return value;
  }


  formatDateTime(dateTime, format = 'medium') {
    let options = merge(
      DATETIME_FORMATS['DATETIME'][format] || {}
    );
    if (this._TZ_SUPPORT) {
      options = merge(options, {timeZone: this.config.timezone});
    }

    let formatter = this._getDateTimeFormat(this.config.locale, options);
    return formatter.format(dateTime);
  }

  formatDate(dateTime, format = 'medium') {
    let options = merge(
      DATETIME_FORMATS['DATE'][format] || {}
    );
    if (this._TZ_SUPPORT) {
      options = merge(options, {timeZone: this.config.timezone});
    }

    let formatter = this._getDateTimeFormat(this.config.locale, options);
    return formatter.format(dateTime);
  }

  formatTime(dateTime, format = 'medium') {
    let options = merge(
      DATETIME_FORMATS['TIME'][format] || {}
    );
    if (this._TZ_SUPPORT) {
      options = merge(options, {timeZone: this.config.timezone});
    }

    let formatter = this._getDateTimeFormat(this.config.locale, options);
    return formatter.format(dateTime);
  }


  formatNumber(number, options = {}) {
    return this.formatDecimal(number, options);
  }

  formatDecimal(number, options = {}) {
    options = merge({style: 'decimal'}, options);
    let formatter = this._getNumberFormat(this.config.locale, options);
    return formatter.format(number);
  }

  formatPercent(number, options = {}) {
    options = merge({style: 'percent'}, options);
    let formatter = this._getNumberFormat(this.config.locale, options);
    return formatter.format(number);
  }

  formatScientific(number, options = {}) {  // eslint-disable-line no-unused-vars
    throw new Error('Not Implemented Yet');
  }

  formatCurrency(number, currency, options = {}) {
    options = merge({style: 'currency', currency}, options);
    let formatter = this._getNumberFormat(this.config.locale, options);
    return formatter.format(number);
  }
}

export default autobind(I18N);
