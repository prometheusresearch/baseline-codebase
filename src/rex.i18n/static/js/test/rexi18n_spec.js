'use strict';


var LazyString = require('../lib/lazystring').LazyString;
var RexI18N = require('../lib/i18n').RexI18N;


// Mock translation structures.
var MOCK_EN = require('json!./mocks/tx_en.json');
var MOCK_FR = require('json!./mocks/tx_fr.json');

// Mock Locale Components
var MOCK_LOCALE_COMMON = require('json!./mocks/locale_common.json');
var MOCK_LOCALE_EN = require('json!./mocks/locale_en.json');
var MOCK_LOCALE_FR = require('json!./mocks/locale_fr.json');


// Define the common setup/teardown routines for testing with.
function commonSetup() {
  jasmine.Ajax.install();

  jasmine.Ajax.stubRequest('/i18n/translations/en').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_EN)
  });

  jasmine.Ajax.stubRequest('/i18n/translations/fr').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_FR)
  });

  jasmine.Ajax.stubRequest('/i18n/locale').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_COMMON)
  });

  jasmine.Ajax.stubRequest('/i18n/locale/en').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_EN)
  });

  jasmine.Ajax.stubRequest('/i18n/locale/fr').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_FR)
  });
}

function commonTeardown() {
  jasmine.Ajax.uninstall();
}

function buildInstances(locales, done) {
    var numInstances = locales.length;
    var onLoad = function () {
      numInstances -= 1;
      if (numInstances === 0) {
        done();
      }
    };

    var instances = {};
    locales.forEach(function (locale) {
      instances[locale] = RexI18N({
        locale: locale,
        timezone: 'America/New_York',
        onLoad: onLoad
      });
    });

    return instances;
}

function respondToLocaleRequests(locale, responseOverride) {
  var urls = [
    ['/i18n/locale/', 'locale_'],
    ['/i18n/translations/', 'tx_']
  ];

  urls.forEach(function (url) {
    var requests, response;

    requests = jasmine.Ajax.requests.filter(url[0] + locale);
    if (requests.length > 0) {
      if (responseOverride) {
        response = responseOverride;
      } else {
        try {
          response = JSON.stringify(require('json!./mocks/' + url[1] + locale + '.json'));
        } catch (exc) {
          response = null;
        }
      }

      if (response) {
        requests[0].response({
          'status': 200,
          'contentType': 'application/json',
          'responseText': response
        });
      } else {
        requests[0].response({
          'status': 404,
          'statusText': '404 Not Found'
        });
      }
    }
  });
}


describe('construction', function () {
  beforeEach(commonSetup);
  afterEach(commonTeardown);

  it('should have known default configuration', function () {
    var ri = RexI18N();
    expect(ri.config.locale).toBe('en');
    expect(ri.config.timezone).toBeTruthy();
    expect(ri.config.baseUrl).toBe('/i18n');
    expect(ri.config.translationsUrl).toBe('/translations');
    expect(ri.config.localeUrl).toBe('/locale');
    expect(ri.config.timeout).toBe(10000);
  });

  it('should allow specification of a timezone', function () {
    var ri = RexI18N({timezone: 'Europe/London'});
    expect(ri.config.timezone).toBe('Europe/London');
  });

  it('should complain if given a bogus timezone', function () {
    function makeBroken() {
      RexI18N({timezone: 'fake'});
    }
    expect(makeBroken).toThrow();
  });

  it('should retrieve translations from the correct location', function () {
    var ri;

    ri = RexI18N();
    expect(jasmine.Ajax.requests.filter('/i18n/translations/en').length).toBe(1);

    ri = RexI18N({locale: 'fr'});
    expect(jasmine.Ajax.requests.filter('/i18n/translations/fr').length).toBe(1);

    ri = RexI18N({translationsUrl: '/somewhere'});
    expect(jasmine.Ajax.requests.filter('/i18n/somewhere/en').length).toBe(1);

    ri = RexI18N({translationsUrl: '/somewhere', locale: 'fr'});
    expect(jasmine.Ajax.requests.filter('/i18n/somewhere/fr').length).toBe(1);

    ri = RexI18N({baseUrl: '/foo', translationsUrl: '/somewhere', locale: 'fr'});
    expect(jasmine.Ajax.requests.filter('/foo/somewhere/fr').length).toBe(1);
  });

  it('should retrieve locale config from the correct location', function () {
    var ri;

    ri = RexI18N({locale: 'es'});
    expect(jasmine.Ajax.requests.filter('/i18n/locale/es').length).toBe(1);

    ri = RexI18N({localeUrl: '/somewhere', locale: 'zh'});
    expect(jasmine.Ajax.requests.filter('/i18n/somewhere/zh').length).toBe(1);
  });

  it('should still work if the translations/locale could not be retrieved', function (done) {
    var onLoad = function (ri) {
      expect(ri.gettext('hello')).toBe('hello');
      expect(ri.formatDate(new Date(2014, 3, 1, 9, 34, 43), 'short').toString()).toBe('04/01/2014');
      done();
    };

    var ri = RexI18N({locale: 'ar', onLoad: onLoad});
    respondToLocaleRequests('ar');
  });

  it('should still work if the translations/locale could not be parsed', function (done) {
    var onLoad = function (ri) {
      expect(ri.gettext('hello')).toBe('hello');
      expect(ri.formatDate(new Date(2014, 3, 1, 9, 34, 43), 'short').toString()).toBe('04/01/2014');
      done();
    };

    var ri = RexI18N({locale: 'pl', onLoad: onLoad});
    respondToLocaleRequests('pl', 'asdads[sa]asd[asd[as]');
  });

  it('should update the isLoaded property appropriately', function (done) {
    var onLoad = function (ri) {
      expect(ri.isLoaded).toBe(true);
      done();
    };

    var ri = RexI18N({locale: 'es', onLoad: onLoad});
    expect(ri.isLoaded).toBe(false);

    respondToLocaleRequests('es');
  });
});


describe('gettext', function () {
  beforeEach(function (done) {
    commonSetup();
    this.instances = buildInstances(['en', 'fr'], done);
  });

  afterEach(commonTeardown);

  it('should translate a simple string', function () {
    expect(this.instances.en.gettext('hello')).toBe('hello');
    expect(this.instances.fr.gettext('hello')).toBe('bonjour');
  });

  it('should translate a formatted string', function () {
    var variables = {
      name: 'Bob'
    };
    expect(this.instances.en.gettext('hello %(name)s', variables)).toBe('hello Bob');
    expect(this.instances.fr.gettext('hello %(name)s', variables)).toBe('bonjour Bob');
  });

  it('should translate a formatted string with extra variables', function () {
    var variables = {
      name: 'Bob',
      color: 'blue'
    };
    expect(this.instances.en.gettext('hello %(name)s', variables)).toBe('hello Bob');
    expect(this.instances.fr.gettext('hello %(name)s', variables)).toBe('bonjour Bob');
  });

  it('should die if not given all formatting variables', function () {
    var variables = {};
    expect(function () { this.instances.en.gettext('hello %(name)s', variables); }).toThrow();
    expect(function () { this.instances.fr.gettext('hello %(name)s', variables); }).toThrow();
  });

  it('should return LazyStrings when the translations have not finished loading', function (done) {
    var onLoad = function (riSpanish) {
      expect(value.toString()).toBe('hola');

      value = riSpanish.gettext('hello %(name)s', {name: 'Bob'});
      expect(value instanceof LazyString).toBe(false);
      expect(value).toBe('hola Bob');

      done();
    };

    var riSpanish = RexI18N({locale: 'es', onLoad: onLoad}),
      value;

    value = riSpanish.gettext('hello');
    expect(value instanceof LazyString).toBe(true);
    expect(value).not.toBe('hello');
    expect(value).not.toBe('hola');
    expect(value.toString()).toBe('hello');

    respondToLocaleRequests('es');
  });
});


describe('ngettext', function () {
  beforeEach(function (done) {
    commonSetup();

    this.instances = buildInstances(['en', 'fr'], done);
  });

  afterEach(commonTeardown);

  it('should translate a simple pluralized string', function () {
    expect(this.instances.en.ngettext('an apple', 'some apples', 1)).toBe('an apple');
    expect(this.instances.en.ngettext('an apple', 'some apples', 2)).toBe('some apples');
    expect(this.instances.fr.ngettext('an apple', 'some apples', 1)).toBe('une pomme');
    expect(this.instances.fr.ngettext('an apple', 'some apples', 2)).toBe('des pommes');
  });

  it('should translate a pluralized string with the number', function () {
    expect(this.instances.en.ngettext('%(num)s apple', '%(num)s apples', 1)).toBe('1 apple');
    expect(this.instances.en.ngettext('%(num)s apple', '%(num)s apples', 2)).toBe('2 apples');
    expect(this.instances.fr.ngettext('%(num)s apple', '%(num)s apples', 1)).toBe('1 pomme');
    expect(this.instances.fr.ngettext('%(num)s apple', '%(num)s apples', 2)).toBe('2 pommes');
  });

  it('should translate a formatted pluralized string', function () {
    var variables = {
      color: 'blue'
    };
    expect(
      this.instances.en.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)
    ).toBe('1 blue apple');
    expect(
      this.instances.en.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)
    ).toBe('2 blue apples');
    expect(
      this.instances.fr.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)
    ).toBe('1 blue pomme');
    expect(
      this.instances.fr.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)
    ).toBe('2 blue pommes');
  });

  it('should return LazyStrings when the translations have not finished loading', function (done) {
    var onLoad = function (riSpanish) {
      expect(value.toString()).toBe('algunas manzanas');

      value = riSpanish.ngettext('%(num)s apple', '%(num)s apples', 2);
      expect(value instanceof LazyString).toBe(false);
      expect(value).toBe('2 manzanas');

      done();
    };

    var riSpanish = RexI18N({locale: 'es', onLoad: onLoad}),
      value;

    value = riSpanish.ngettext('an apple', 'some apples', 2);
    expect(value instanceof LazyString).toBe(true);
    expect(value).not.toBe('some apples');
    expect(value).not.toBe('algunas manzanas');
    expect(value.toString()).toBe('some apples');

    respondToLocaleRequests('es');
  });
});


describe('formatDate', function () {
  var testDate = new Date(2014, 3, 1, 9, 34, 43);

  beforeEach(function (done) {
    commonSetup();

    this.instances = buildInstances(['en', 'fr'], done);
  });

  afterEach(commonTeardown);

  it('has a format named \'short\'', function () {
    expect(this.instances.en.formatDate(testDate, 'short')).toBe('4/1/14');
    expect(this.instances.fr.formatDate(testDate, 'short')).toBe('01/04/2014');
  });

  it('has a format named \'medium\'', function () {
    expect(this.instances.en.formatDate(testDate, 'medium')).toBe('Apr 1, 2014');
    expect(this.instances.fr.formatDate(testDate, 'medium')).toBe('1 avr. 2014');
  });

  it('has a format named \'long\'', function () {
    expect(this.instances.en.formatDate(testDate, 'long')).toBe('April 1, 2014');
    expect(this.instances.fr.formatDate(testDate, 'long')).toBe('1 avril 2014');
  });

  it('has a format named \'full\'', function () {
    expect(this.instances.en.formatDate(testDate, 'full')).toBe('Tuesday, April 1, 2014');
    expect(this.instances.fr.formatDate(testDate, 'full')).toBe('mardi 1 avril 2014');
  });

  it('has a format named \'iso\'', function () {
    expect(this.instances.en.formatDate(testDate, 'iso')).toBe('2014-04-01');
    expect(this.instances.fr.formatDate(testDate, 'iso')).toBe('2014-04-01');
  });

  it('defaults to the medium format', function () {
    expect(this.instances.en.formatDate(testDate)).toBe('Apr 1, 2014');
    expect(this.instances.fr.formatDate(testDate)).toBe('1 avr. 2014');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(this.instances.en.formatDate(testDate, 'short', 'Pacific/Honolulu')).toBe('3/31/14');
    expect(this.instances.fr.formatDate(testDate, 'short', 'Pacific/Honolulu')).toBe('31/03/2014');
  });
});


describe('formatDateTime', function () {
  var testDate = new Date(2014, 3, 1, 9, 34, 43);

  beforeEach(function (done) {
    commonSetup();

    this.instances = buildInstances(['en', 'fr'], done);
  });

  afterEach(commonTeardown);

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'short\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'short')).toBe('4/1/2014, 5:34 AM');
    expect(this.instances.fr.formatDateTime(testDate, 'short')).toBe('01/04/2014 05:34');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'medium\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'medium')).toBe('Apr 1, 2014, 5:34:43 AM');
    expect(this.instances.fr.formatDateTime(testDate, 'medium')).toBe('1 avr. 2014 05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'long\'', function () {
    expect(this.instances.fr.formatDateTime(testDate, 'long')).toBe('1 avril 2014 05:34 -0400');
    expect(this.instances.en.formatDateTime(testDate, 'long')).toBe('April 1, 2014 5:34 AM -0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'full\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'full')).toBe('Tuesday, April 1, 2014 5:34 AM -0400');
    expect(this.instances.fr.formatDateTime(testDate, 'full')).toBe('mardi 1 avril 2014 05:34 -0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'iso\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'iso')).toBe('2014-04-01T05:34:43-0400');
    expect(this.instances.fr.formatDateTime(testDate, 'iso')).toBe('2014-04-01T05:34:43-0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('defaults to the medium format', function () {
    expect(this.instances.en.formatDateTime(testDate)).toBe('Apr 1, 2014, 5:34:43 AM');
    expect(this.instances.fr.formatDateTime(testDate)).toBe('1 avr. 2014 05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(this.instances.en.formatDateTime(testDate, 'short', 'America/Chicago')).toBe('4/1/2014, 4:34 AM');
    expect(this.instances.fr.formatDateTime(testDate, 'short', 'America/Chicago')).toBe('01/04/2014 04:34');
  });
});


describe('formatTime', function () {
  var testDate = new Date(2014, 3, 1, 9, 34, 43);

  beforeEach(function (done) {
    commonSetup();

    this.instances = buildInstances(['en', 'fr'], done);
  });

  afterEach(commonTeardown);

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'short\'', function () {
    expect(this.instances.en.formatTime(testDate, 'short')).toBe('5:34 AM');
    expect(this.instances.fr.formatTime(testDate, 'short')).toBe('05:34');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'medium\'', function () {
    expect(this.instances.en.formatTime(testDate, 'medium')).toBe('5:34:43 AM');
    expect(this.instances.fr.formatTime(testDate, 'medium')).toBe('05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'long\'', function () {
    expect(this.instances.en.formatTime(testDate, 'long')).toBe('5:34:43 AM -0400');
    expect(this.instances.fr.formatTime(testDate, 'long')).toBe('05:34:43 -0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'full\'', function () {
    expect(this.instances.en.formatTime(testDate, 'full')).toBe('5:34:43 AM GMT-04:00');
    expect(this.instances.fr.formatTime(testDate, 'full')).toBe('05:34:43 UTC-04:00');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'iso\'', function () {
    expect(this.instances.en.formatTime(testDate, 'iso')).toBe('05:34:43-0400');
    expect(this.instances.fr.formatTime(testDate, 'iso')).toBe('05:34:43-0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('defaults to the medium format', function () {
    expect(this.instances.en.formatTime(testDate)).toBe('5:34:43 AM');
    expect(this.instances.fr.formatTime(testDate)).toBe('05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(this.instances.en.formatTime(testDate, 'short', 'America/Chicago')).toBe('4:34 AM');
    expect(this.instances.fr.formatTime(testDate, 'short', 'America/Chicago')).toBe('04:34');
  });
});


describe('formatNumber', function () {
  var locales = ['en', 'fr'],
    ri = {},
    l,
    i,
    vectors = [123, 1.23, 0, 123456, 123456.78912],
    results = {
      'en': ['123', '1.23', '0', '123,456', '123,456.789'],
      'fr': ['123', '1,23', '0', '123\u00A0456', '123\u00A0456,789']
    };

  beforeEach(function (done) {
    commonSetup();

    ri = buildInstances(locales, done);
  });

  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] as a decimal in "' + locale + '"', function () {
          expect(ri[locale].formatNumber(vector)).toBe(result);
        });
      }).call(this);
    }
  }

  it('should allow arbitrary formats', function () {
    expect(ri.en.formatNumber(3.141592, {
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 3
    })).toBe('3.14');

    expect(ri.en.formatNumber(3141592, {
      useGrouping: false
    })).toBe('3141592');
  });
});


describe('formatDecimal', function () {
  var locales = ['en', 'fr'],
    ri = {},
    l,
    i,
    vectors = [123, 1.23, 0, 123456, 123456.78912],
    results = {
      'en': ['123', '1.23', '0', '123,456', '123,456.789'],
      'fr': ['123', '1,23', '0', '123\u00A0456', '123\u00A0456,789']
    };

  beforeEach(function (done) {
    commonSetup();

    ri = buildInstances(locales, done);
  });

  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatDecimal(vector)).toBe(result);
        });
      }).call(this);
    }
  }
});


describe('formatPercent', function () {
  var locales = ['en', 'fr'],
    ri = {},
    l,
    i,
    vectors = [123, 1.23, 0, 0.5, 0.6666667],
    results = {
      'en': ['12,300%', '123%', '0%', '50%', '66%'],
      'fr': ['12\u00A0300\u00A0%', '123\u00A0%', '0\u00A0%', '50\u00A0%', '66\u00A0%']
    };

  beforeEach(function (done) {
    commonSetup();

    ri = buildInstances(locales, done);
  });

  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatPercent(vector)).toBe(result);
        });
      }).call(this);
    }
  }
});


// SKIPPED: No scientific support yet.
xdescribe('formatScientific', function () {
  var locales = ['en', 'fr'],
    ri = {},
    l,
    i,
    vectors = [], // TODO: Add some test vectors
    results = {
      'en': [],
      'fr': []
    };

  beforeEach(function (done) {
    commonSetup();

    ri = buildInstances(locales, done);
  });

  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatScientific(vector)).toBe(result);
        });
      }).call(this);
    }
  }
});


// SKIPPED: No currency support yet.
xdescribe('formatCurrency', function () {
  var locales = ['en', 'fr'],
    ri = {},
    l,
    i,
    vectors = [], // TODO: Add some test vectors
    results = {
      'en': [],
      'fr': []
    };

  beforeEach(function (done) {
    commonSetup();

    ri = buildInstances(locales, done);
  });

  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatCurrency(vector)).toBe(result);
        });
      }).call(this);
    }
  }
});


describe('globalize-based methods', function () {
  var vectors = [
    {
      func: 'formatDate',
      input: new Date(2014, 3, 1, 9, 34, 43),
      interim: '04/01/2014',
      final: '1/4/2014'
    },
    {
      func: 'formatDateTime',
      input: new Date(2014, 3, 1, 9, 34, 43),
      interim: 'Tue Apr  1 09:34:43 2014',
      final: '1/4/2014 9:34:43'
    },
    {
      func: 'formatTime',
      input: new Date(2014, 3, 1, 9, 34, 43),
      interim: '09:34:43',
      final: '9:34:43'
    },
    {
      func: 'formatNumber',
      input: 12345,
      interim: '12345',
      final: '12.345'
    },
    {
      func: 'formatDecimal',
      input: 12345,
      interim: '12345',
      final: '12.345'
    },
    {
      func: 'formatPercent',
      input: 12345,
      interim: '12345',
      final: '1.234.500%'
    }
  ];

  it('should return LazyStrings when the locale info has not finished loading', function (done) {
    var onLoad = function (riSpanish) {
      for (i = 0; i < vectors.length; i += 1) {
        expect(values[i].toString()).toBe(vectors[i].final);
        check = riSpanish[vectors[i].func](vectors[i].input);
        expect(check instanceof LazyString).not.toBe(true);
        expect(check).toBe(vectors[i].final);
      }

      done();
    };

    var riSpanish = RexI18N({locale: 'es', onLoad: onLoad}),
      values = [],
      check,
      i;

    for (i = 0; i < vectors.length; i += 1) {
      values[i] = riSpanish[vectors[i].func](vectors[i].input);
      expect(values[i] instanceof LazyString).toBe(true);
      expect(values[i]).not.toBe(vectors[i].interm);
      expect(values[i]).not.toBe(vectors[i].final);
      expect(values[i].toString()).toBe(vectors[i].interim);
    }

    respondToLocaleRequests('es');
  });
});

