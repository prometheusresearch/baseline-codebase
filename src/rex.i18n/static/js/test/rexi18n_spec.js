'use strict';


var i18n = require('../lib/index.js');
var expect = require('chai').expect;


var CAPTURE_LOG = true;


// Mock translation structures.
var MOCK_EN = require('json!./mocks/tx_en.json');
var MOCK_FR = require('json!./mocks/tx_fr.json');
var MOCK_ES = require('json!./mocks/tx_es.json');

// Mock Locale Components
var MOCK_LOCALE_COMMON = require('json!./mocks/locale_common.json');
var MOCK_LOCALE_EN = require('json!./mocks/locale_en.json');
var MOCK_LOCALE_FR = require('json!./mocks/locale_fr.json');
var MOCK_LOCALE_ES = require('json!./mocks/locale_es.json');


// Define the common setup/teardown routines for testing with.
function commonSetup() {
  jasmine.Ajax.install();

  jasmine.Ajax.stubRequest('/translations/en').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_EN)
  });

  jasmine.Ajax.stubRequest('/translations/fr').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_FR)
  });

  jasmine.Ajax.stubRequest('/locale').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_COMMON)
  });

  jasmine.Ajax.stubRequest('/locale/en').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_EN)
  });

  jasmine.Ajax.stubRequest('/locale/fr').andReturn({
    'status': 200,
    'contentType': 'application/json',
    'responseText': JSON.stringify(MOCK_LOCALE_FR)
  });

  if (CAPTURE_LOG && global.console && global.console.log) {
    // Mute & capture any logging.
    spyOn(global.console, 'log');
  }
}

function commonTeardown() {
  jasmine.Ajax.uninstall();

  if (CAPTURE_LOG && global.console && global.console.log) {
    global.console.log.calls.reset();
  }
}


describe('construction', function () {
  beforeEach(commonSetup);
  afterEach(commonTeardown);

  it('should have known default configuration', function () {
    var ri = i18n.RexI18N();
    expect(ri.config.locale).to.equal('en');
    expect(ri.config.timezone).to.be.ok;
    expect(ri.config.translationsBaseUrl).to.equal('/translations');
    expect(ri.config.localeBaseUrl).to.equal('/locale');
    expect(ri.config.timeout).to.equal(10000);
  });

  it('should allow specification of a timezone', function () {
    var ri = i18n.RexI18N({timezone: 'Europe/London'});
    expect(ri.config.timezone).to.equal('Europe/London');
  });

  it('should complain if given a bogus timezone', function () {
    function makeBroken() {
      i18n.RexI18N({timezone: 'fake'});
    }
    expect(makeBroken).to.throw(/Invalid timezone/);
  });

  it('should retrieve translations from the correct location', function () {
    var ri;

    ri = i18n.RexI18N();
    expect(jasmine.Ajax.requests.filter('/translations/en').length).to.equal(1);

    ri = i18n.RexI18N({locale: 'fr'});
    expect(jasmine.Ajax.requests.filter('/translations/fr').length).to.equal(1);

    ri = i18n.RexI18N({translationsBaseUrl: '/somewhere'});
    expect(jasmine.Ajax.requests.filter('/somewhere/en').length).to.equal(1);

    ri = i18n.RexI18N({translationsBaseUrl: '/somewhere', locale: 'fr'});
    expect(jasmine.Ajax.requests.filter('/somewhere/fr').length).to.equal(1);
  });

  it('should retrieve locale config from the correct location', function () {
    var ri;

    ri = i18n.RexI18N({locale: 'es'});
    expect(jasmine.Ajax.requests.filter('/locale/es').length).to.equal(1);

    ri = i18n.RexI18N({localeBaseUrl: '/somewhere', locale: 'zh'});
    expect(jasmine.Ajax.requests.filter('/somewhere/zh').length).to.equal(1);
  });

  it('should still work if the translations could not be retrieved', function () {
    var ri = i18n.RexI18N({locale: 'es'});
    jasmine.Ajax.requests.filter('/translations/es')[0].response({
      'status': 404,
      'statusText': '404 Not Found'
    });
    expect(ri.gettext('hello')).to.equal('hello');
  });

  it('should still work if the translations could not be parsed', function () {
    var ri = i18n.RexI18N({locale: 'es'});
    jasmine.Ajax.requests.filter('/translations/es')[0].response({
      'status': 200,
      'contentType': 'application/json',
      'responseText': 'asd[asd[]asda]d'
    });
    expect(ri.gettext('hello')).to.equal('hello');
  });
});


describe('gettext', function () {
  var riEnglish, riFrench;

  beforeEach(function () {
    commonSetup();

    riEnglish = i18n.RexI18N({locale: 'en'});
    riFrench = i18n.RexI18N({locale: 'fr'});
  });

  afterEach(commonTeardown);

  it('should translate a simple string', function () {
    expect(riEnglish.gettext('hello')).to.equal('hello');
    expect(riFrench.gettext('hello')).to.equal('bonjour');
  });

  it('should translate a formatted string', function () {
    var variables = {
      name: 'Bob'
    };
    expect(riEnglish.gettext('hello %(name)s', variables)).to.equal('hello Bob');
    expect(riFrench.gettext('hello %(name)s', variables)).to.equal('bonjour Bob');
  });

  it('should translate a formatted string with extra variables', function () {
    var variables = {
      name: 'Bob',
      color: 'blue'
    };
    expect(riEnglish.gettext('hello %(name)s', variables)).to.equal('hello Bob');
    expect(riFrench.gettext('hello %(name)s', variables)).to.equal('bonjour Bob');
  });

  it('should die if not given all formatting variables', function () {
    var variables = {};
    expect(function () { riEnglish.gettext('hello %(name)s', variables); }).to.throw();
    expect(function () { riFrench.gettext('hello %(name)s', variables); }).to.throw();
  });

  it('should return LazyStrings when the translations have not finished loading', function () {
    var riSpanish = i18n.RexI18N({locale: 'es'}),
      value;

    value = riSpanish.gettext('hello');
    expect(value).to.be.instanceof(i18n.LazyString);
    expect(value).to.not.equal('hello');
    expect(value).to.not.equal('hola');
    expect(value.toString()).to.equal('hello');

    jasmine.Ajax.requests.filter('/translations/es')[0].response({
      'status': 200,
      'contentType': 'application/json',
      'responseText': JSON.stringify(MOCK_ES)
    });

    expect(value.toString()).to.equal('hola');

    value = riSpanish.gettext('hello %(name)s', {name: 'Bob'});
    expect(value).to.not.be.instanceof(i18n.LazyString);
    expect(value).to.equal('hola Bob');
  });
});


describe('ngettext', function () {
  var riEnglish, riFrench;

  beforeEach(function () {
    commonSetup();

    riEnglish = i18n.RexI18N({locale: 'en'});
    riFrench = i18n.RexI18N({locale: 'fr'});
  });

  afterEach(commonTeardown);

  it('should translate a simple pluralized string', function () {
    expect(riEnglish.ngettext('an apple', 'some apples', 1)).to.equal('an apple');
    expect(riEnglish.ngettext('an apple', 'some apples', 2)).to.equal('some apples');
    expect(riFrench.ngettext('an apple', 'some apples', 1)).to.equal('une pomme');
    expect(riFrench.ngettext('an apple', 'some apples', 2)).to.equal('des pommes');
  });

  it('should translate a pluralized string with the number', function () {
    expect(riEnglish.ngettext('%(num)s apple', '%(num)s apples', 1)).to.equal('1 apple');
    expect(riEnglish.ngettext('%(num)s apple', '%(num)s apples', 2)).to.equal('2 apples');
    expect(riFrench.ngettext('%(num)s apple', '%(num)s apples', 1)).to.equal('1 pomme');
    expect(riFrench.ngettext('%(num)s apple', '%(num)s apples', 2)).to.equal('2 pommes');
  });

  it('should translate a formatted pluralized string', function () {
    var variables = {
      color: 'blue'
    };
    expect(
      riEnglish.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)
    ).to.equal('1 blue apple');
    expect(
      riEnglish.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)
    ).to.equal('2 blue apples');
    expect(
      riFrench.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)
    ).to.equal('1 blue pomme');
    expect(
      riFrench.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)
    ).to.equal('2 blue pommes');
  });

  it('should return LazyStrings when the translations have not finished loading', function () {
    var riSpanish = i18n.RexI18N({locale: 'es'}),
      value;

    value = riSpanish.ngettext('an apple', 'some apples', 2);
    expect(value).to.be.instanceof(i18n.LazyString);
    expect(value).to.not.equal('some apples');
    expect(value).to.not.equal('algunas manzanas');
    expect(value.toString()).to.equal('some apples');

    jasmine.Ajax.requests.filter('/translations/es')[0].response({
      'status': 200,
      'contentType': 'application/json',
      'responseText': JSON.stringify(MOCK_ES)
    });

    expect(value.toString()).to.equal('algunas manzanas');

    value = riSpanish.ngettext('%(num)s apple', '%(num)s apples', 2);
    expect(value).to.not.be.instanceof(i18n.LazyString);
    expect(value).to.equal('2 manzanas');
  });
});


describe('formatDate', function () {
  var riEnglish, riFrench, testDate = new Date(2014, 3, 1, 9, 34, 43);

  beforeEach(function () {
    commonSetup();

    riEnglish = i18n.RexI18N({locale: 'en', timezone: 'America/New_York'});
    riFrench = i18n.RexI18N({locale: 'fr', timezone: 'America/New_York'});
  });

  afterEach(commonTeardown);

  it('has a format named \'short\'', function () {
    expect(riEnglish.formatDate(testDate, 'short')).to.equal('4/1/14');
    expect(riFrench.formatDate(testDate, 'short')).to.equal('01/04/2014');
  });

  it('has a format named \'medium\'', function () {
    expect(riEnglish.formatDate(testDate, 'medium')).to.equal('Apr 1, 2014');
    expect(riFrench.formatDate(testDate, 'medium')).to.equal('1 avr. 2014');
  });

  it('has a format named \'long\'', function () {
    expect(riEnglish.formatDate(testDate, 'long')).to.equal('April 1, 2014');
    expect(riFrench.formatDate(testDate, 'long')).to.equal('1 avril 2014');
  });

  it('has a format named \'full\'', function () {
    expect(riEnglish.formatDate(testDate, 'full')).to.equal('Tuesday, April 1, 2014');
    expect(riFrench.formatDate(testDate, 'full')).to.equal('mardi 1 avril 2014');
  });

  it('has a format named \'iso\'', function () {
    expect(riEnglish.formatDate(testDate, 'iso')).to.equal('2014-04-01');
    expect(riFrench.formatDate(testDate, 'iso')).to.equal('2014-04-01');
  });

  it('defaults to the medium format', function () {
    expect(riEnglish.formatDate(testDate)).to.equal('Apr 1, 2014');
    expect(riFrench.formatDate(testDate)).to.equal('1 avr. 2014');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(riEnglish.formatDate(testDate, 'short', 'Pacific/Honolulu')).to.equal('3/31/14');
    expect(riFrench.formatDate(testDate, 'short', 'Pacific/Honolulu')).to.equal('31/03/2014');
  });
});


describe('formatDateTime', function () {
  var riEnglish, riFrench, testDate = new Date(2014, 3, 1, 9, 34, 43);

  beforeEach(function () {
    commonSetup();

    riEnglish = i18n.RexI18N({locale: 'en', timezone: 'America/New_York'});
    riFrench = i18n.RexI18N({locale: 'fr', timezone: 'America/New_York'});
  });

  afterEach(commonTeardown);

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'short\'', function () {
    expect(riEnglish.formatDateTime(testDate, 'short')).to.equal('4/1/2014, 5:34 AM');
    expect(riFrench.formatDateTime(testDate, 'short')).to.equal('01/04/2014 05:34');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'medium\'', function () {
    expect(riEnglish.formatDateTime(testDate, 'medium')).to.equal('Apr 1, 2014, 5:34:43 AM');
    expect(riFrench.formatDateTime(testDate, 'medium')).to.equal('1 avr. 2014 05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'long\'', function () {
    expect(riFrench.formatDateTime(testDate, 'long')).to.equal('1 avril 2014 05:34 -0400');
    expect(riEnglish.formatDateTime(testDate, 'long')).to.equal('April 1, 2014 5:34 AM -0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'full\'', function () {
    expect(riEnglish.formatDateTime(testDate, 'full')).to.equal('Tuesday, April 1, 2014 5:34 AM -0400');
    expect(riFrench.formatDateTime(testDate, 'full')).to.equal('mardi 1 avril 2014 05:34 -0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'iso\'', function () {
    expect(riEnglish.formatDateTime(testDate, 'iso')).to.equal('2014-04-01T05:34:43-0400');
    expect(riFrench.formatDateTime(testDate, 'iso')).to.equal('2014-04-01T05:34:43-0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('defaults to the medium format', function () {
    expect(riEnglish.formatDateTime(testDate)).to.equal('Apr 1, 2014, 5:34:43 AM');
    expect(riFrench.formatDateTime(testDate)).to.equal('1 avr. 2014 05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(riEnglish.formatDateTime(testDate, 'short', 'America/Chicago')).to.equal('4/1/2014, 4:34 AM');
    expect(riFrench.formatDateTime(testDate, 'short', 'America/Chicago')).to.equal('01/04/2014 04:34');
  });
});


describe('formatTime', function () {
  var riEnglish, riFrench, testDate = new Date(2014, 3, 1, 9, 34, 43);

  beforeEach(function () {
    commonSetup();

    riEnglish = i18n.RexI18N({locale: 'en', timezone: 'America/New_York'});
    riFrench = i18n.RexI18N({locale: 'fr', timezone: 'America/New_York'});
  });

  afterEach(commonTeardown);

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'short\'', function () {
    expect(riEnglish.formatTime(testDate, 'short')).to.equal('5:34 AM');
    expect(riFrench.formatTime(testDate, 'short')).to.equal('05:34');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'medium\'', function () {
    expect(riEnglish.formatTime(testDate, 'medium')).to.equal('5:34:43 AM');
    expect(riFrench.formatTime(testDate, 'medium')).to.equal('05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'long\'', function () {
    expect(riEnglish.formatTime(testDate, 'long')).to.equal('5:34:43 AM -0400');
    expect(riFrench.formatTime(testDate, 'long')).to.equal('05:34:43 -0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'full\'', function () {
    expect(riEnglish.formatTime(testDate, 'full')).to.equal('5:34:43 AM GMT-04:00');
    expect(riFrench.formatTime(testDate, 'full')).to.equal('05:34:43 UTC-04:00');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('has a format named \'iso\'', function () {
    expect(riEnglish.formatTime(testDate, 'iso')).to.equal('05:34:43-0400');
    expect(riFrench.formatTime(testDate, 'iso')).to.equal('05:34:43-0400');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('defaults to the medium format', function () {
    expect(riEnglish.formatTime(testDate)).to.equal('5:34:43 AM');
    expect(riFrench.formatTime(testDate)).to.equal('05:34:43');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(riEnglish.formatTime(testDate, 'short', 'America/Chicago')).to.equal('4:34 AM');
    expect(riFrench.formatTime(testDate, 'short', 'America/Chicago')).to.equal('04:34');
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

  beforeEach(function () {
    commonSetup();

    ri = {};
    for (l = 0; l < locales.length; l += 1) {
      ri[locales[l]] = i18n.RexI18N({locale: locales[l]});
    }
  });

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] as a decimal in "' + locale + '"', function () {
          expect(ri[locale].formatNumber(vector)).to.equal(result);
        });
      }).call(this);
    }
  }

  it('should allow arbitrary formats', function () {
    expect(ri.en.formatNumber(3.141592, {
      minimumSignificantDigits: 1,
      maximumSignificantDigits: 3
    })).to.equal('3.14');

    expect(ri.en.formatNumber(3141592, {
      useGrouping: false
    })).to.equal('3141592');
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

  beforeEach(function () {
    commonSetup();

    ri = {};
    for (l = 0; l < locales.length; l += 1) {
      ri[locales[l]] = i18n.RexI18N({locale: locales[l]});
    }
  });

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatDecimal(vector)).to.equal(result);
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

  beforeEach(function () {
    commonSetup();

    ri = {};
    for (l = 0; l < locales.length; l += 1) {
      ri[locales[l]] = i18n.RexI18N({locale: locales[l]});
    }
  });

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatPercent(vector)).to.equal(result);
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

  beforeEach(function () {
    commonSetup();

    ri = {};
    for (l = 0; l < locales.length; l += 1) {
      ri[locales[l]] = i18n.RexI18N({locale: locales[l]});
    }
  });

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatScientific(vector)).to.equal(result);
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

  beforeEach(function () {
    commonSetup();

    ri = {};
    for (l = 0; l < locales.length; l += 1) {
      ri[locales[l]] = i18n.RexI18N({locale: locales[l]});
    }
  });

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      /*jshint loopfunc:true */
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatCurrency(vector)).to.equal(result);
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
      interim: 'Tue Apr 01 2014',
      final: '1/4/2014'
    },
    {
      func: 'formatDateTime',
      input: new Date(2014, 3, 1, 9, 34, 43),
      interim: 'Tue Apr 01 2014 09:34:43 GMT-0400 (EDT)',
      final: '1/4/2014 9:34:43'
    },
    {
      func: 'formatTime',
      input: new Date(2014, 3, 1, 9, 34, 43),
      interim: '09:34:43 GMT-0400 (EDT)',
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

  it('should return LazyStrings when the locale info has not finished loading', function () {
    var riSpanish = i18n.RexI18N({locale: 'es'}),
      values = [],
      check,
      i;

    for (i = 0; i < vectors.length; i += 1) {
      values[i] = riSpanish[vectors[i].func](vectors[i].input);
      expect(values[i]).to.be.instanceof(i18n.LazyString);
      expect(values[i]).to.not.equal(vectors[i].interm);
      expect(values[i]).to.not.equal(vectors[i].final);
      expect(values[i].toString()).to.equal(vectors[i].interim);
    }

    jasmine.Ajax.requests.filter('/locale/es')[0].response({
      'status': 200,
      'contentType': 'application/json',
      'responseText': JSON.stringify(MOCK_LOCALE_ES)
    });

    for (i = 0; i < vectors.length; i += 1) {
      expect(values[i].toString()).to.equal(vectors[i].final);
      check = riSpanish[vectors[i].func](vectors[i].input);
      expect(check).to.not.be.instanceof(i18n.LazyString);
      expect(check).to.equal(vectors[i].final);
    }
  });
});

