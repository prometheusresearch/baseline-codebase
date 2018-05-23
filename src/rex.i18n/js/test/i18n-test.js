/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import {expect, enableFetchMocking, disableFetchMocking} from './tools';
import {ENGLISH, FRENCH, ARABIC} from './translations';

import I18N from '../lib/i18n';


function commonSetup() {
  enableFetchMocking({
    '/i18n/translations/en': {
      status: 200,
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(ENGLISH)
    },
    '/i18n/translations/fr': {
      status: 200,
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(FRENCH)
    },
    '/i18n/translations/ar': {
      status: 200,
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(ARABIC)
    },
    '/i18n/translations/pl': {
      status: 200,
      headers: {
        'Content-type': 'application/json'
      },
      body: 'this[is]broken[{json'
    }
  });
}

function commonTeardown() {
  disableFetchMocking();
}

function buildInstances(locales, done) {
  let numInstances = locales.length;
  let onLoad = function () {
    numInstances -= 1;
    if (numInstances === 0) {
      done();
    }
  };

  let instances = {};
  locales.forEach(function (locale) {
    instances[locale] = new I18N({
      locale: locale,
      timezone: 'America/New_York',
      onLoad: onLoad
    });
  });

  return instances;
}


describe('construction', function () {
  beforeEach(commonSetup);
  afterEach(commonTeardown);

  it('should have known default configuration', function () {
    let i18n = new I18N();
    expect(i18n.config.locale).to.equal('en');
    expect(i18n.config.timezone).to.exist;
    expect(i18n.config.baseUrl).to.equal('/i18n');
    expect(i18n.config.translationsUrl).to.equal('/translations');
  });

  it('should allow specification of a timezone', function () {
    let i18n = new I18N({timezone: 'Europe/London'});
    expect(i18n.config.timezone).to.equal('Europe/London');
  });

  it('should complain if given a bogus timezone', function () {
    function makeBroken() {
      new I18N({timezone: 'fake'});
    }
    expect(makeBroken).to.throw(Error, /Invalid timezone/);
  });

  it('should still work if the translations could not be retrieved', function (done) {
    let onLoad = function (i18n) {
      expect(i18n.gettext('hello')).to.equal('hello');
      expect(i18n.isLoaded).to.equal(true);
      done();
    };
    new I18N({locale: 'ar', onLoad: onLoad});
  });

  it('should still work if the translations could not be parsed', function (done) {
    let onLoad = function (i18n) {
      expect(i18n.gettext('hello')).to.equal('hello');
      expect(i18n.isLoaded).to.equal(true);
      done();
    };
    new I18N({locale: 'pl', onLoad: onLoad});
  });
});


describe('isRightToLeft', function () {
  beforeEach(function (done) {
    commonSetup();
    this.instances = buildInstances(['en', 'fr', 'ar'], done);
  });
  afterEach(commonTeardown);

  it('should return false if the language is LTR', function () {
    expect(this.instances.en.isRightToLeft()).to.be.false;
    expect(this.instances.fr.isRightToLeft()).to.be.false;
  });

  it('should return true if the language is RTL', function () {
    expect(this.instances.ar.isRightToLeft()).to.be.true;
  });
});


describe('gettext', function () {
  beforeEach(function (done) {
    commonSetup();
    this.instances = buildInstances(['en', 'fr'], done);
  });
  afterEach(commonTeardown);

  it('should translate a simple string', function () {
    expect(this.instances.en.gettext('hello')).to.equal('hello');
    expect(this.instances.fr.gettext('hello')).to.equal('bonjour');
  });

  it('should translate a formatted string', function () {
    var variables = {
      name: 'Bob'
    };
    expect(this.instances.en.gettext('hello %(name)s', variables)).to.equal('hello Bob');
    expect(this.instances.fr.gettext('hello %(name)s', variables)).to.equal('bonjour Bob');
  });

  it('should translate a formatted string with different types', function () {
    var testDate = new Date(Date.UTC(2014, 3, 1, 9, 34, 43));
    var variables = {
      a_string: 'foobar',
      a_number: 123.456789,
      a_percent: 0.3,
      a_currency: 1.23,
      a_date: testDate,
    };

    expect(this.instances.en.gettext(
      '%(a_string)s | %(a_number)n | %(a_percent)p | %(a_currency)c | %(a_date)d | %(a_date)t | %(a_date)dt',
      variables
    )).to.equal(
      'foobar | 123.456789 | 30% | $1.23 | Apr 1, 2014 | 5:34:43 AM | Apr 1, 2014, 5:34:43 AM'
    );
    expect(this.instances.fr.gettext(
      '%(a_string)s | %(a_number)n | %(a_percent)p | %(a_currency)c | %(a_date)d | %(a_date)t | %(a_date)dt',
      variables
    )).to.equal(
      'foobar | 123,456789 | 30 % | 1,23 $US | 1 avr. 2014 | 5:34:43 AM | 1 avr. 2014 à 5:34:43 AM'
    );

    expect(this.instances.en.gettext(
      '%(a_string)s | %(a_number:2)n | %(a_percent)p | %(a_currency:EUR)c | %(a_date:short)d | %(a_date:full)t | %(a_date:log)dt',
      variables
    )).to.equal(
      'foobar | 123.46 | 30% | €1.23 | 4/1/2014 | 5:34:43 AM EDT | 4/1/2014'
    );
    expect(this.instances.fr.gettext(
      '%(a_string)s | %(a_number:2)n | %(a_percent)p | %(a_currency:EUR)c | %(a_date:short)d | %(a_date:full)t | %(a_date:log)dt',
      variables
    )).to.equal(
      'foobar | 123,46 | 30 % | 1,23 € | 01/04/2014 | 5:34:43 AM UTC−4 | 01/04/2014'
    );
  });

  it('should translate a formatted string with extra variables', function () {
    var variables = {
      name: 'Bob',
      color: 'blue'
    };
    expect(this.instances.en.gettext('hello %(name)s', variables)).to.equal('hello Bob');
    expect(this.instances.fr.gettext('hello %(name)s', variables)).to.equal('bonjour Bob');
  });

  it('should not die if not given all formatting variables', function () {
    var variables = {};
    expect(this.instances.en.gettext('hello %(name)s', variables)).to.equal('hello ');
    expect(this.instances.fr.gettext('hello %(name)s', variables)).to.equal('bonjour ');
  });

  it('should not die if it sees things that kinda-sorta look like formatting variables', function () {
    expect(this.instances.en.gettext('%s, %()s, 100%, %%, %(foo)q')).to.equal('%s, %()s, 100%, %%, %(foo)q');
    expect(this.instances.fr.gettext('%s, %()s, 100%, %%, %(foo)q')).to.equal('%s, %()s, 100%, %%, %(foo)q');
  });

  it('should not die if given bad formatting values', function () {
    var variables = {
      bad_number: 'foo',
      bad_date: 'bar',
    };
    expect(this.instances.en.gettext('%(bad_number)n | %(bad_date)d', variables)).to.equal('NaN | bar');
    expect(this.instances.fr.gettext('%(bad_number)n | %(bad_date)d', variables)).to.equal('NaN | bar');
  });
});


describe('ngettext', function () {
  beforeEach(function (done) {
    commonSetup();
    this.instances = buildInstances(['en', 'fr'], done);
  });
  afterEach(commonTeardown);

  it('should translate a simple pluralized string', function () {
    expect(this.instances.en.ngettext('an apple', 'some apples', 1)).to.equal('an apple');
    expect(this.instances.en.ngettext('an apple', 'some apples', 2)).to.equal('some apples');
    expect(this.instances.fr.ngettext('an apple', 'some apples', 1)).to.equal('une pomme');
    expect(this.instances.fr.ngettext('an apple', 'some apples', 2)).to.equal('des pommes');
  });

  it('should translate a pluralized string with the number', function () {
    expect(this.instances.en.ngettext('%(num)s apple', '%(num)s apples', 1)).to.equal('1 apple');
    expect(this.instances.en.ngettext('%(num)s apple', '%(num)s apples', 2)).to.equal('2 apples');
    expect(this.instances.fr.ngettext('%(num)s apple', '%(num)s apples', 1)).to.equal('1 pomme');
    expect(this.instances.fr.ngettext('%(num)s apple', '%(num)s apples', 2)).to.equal('2 pommes');
  });

  it('should translate a formatted pluralized string', function () {
    var variables = {
      color: 'blue'
    };
    expect(
      this.instances.en.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)
    ).to.equal('1 blue apple');
    expect(
      this.instances.en.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)
    ).to.equal('2 blue apples');
    expect(
      this.instances.fr.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)
    ).to.equal('1 blue pomme');
    expect(
      this.instances.fr.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)
    ).to.equal('2 blue pommes');
  });
});


describe('formatDate', function () {
  var testDate = new Date(Date.UTC(2014, 3, 1, 9, 34, 43));

  beforeEach(function (done) {
    commonSetup();
    this.instances = buildInstances(['en', 'fr'], done);
  });
  afterEach(commonTeardown);

  it('has a format named \'short\'', function () {
    expect(this.instances.en.formatDate(testDate, 'short')).to.equal('4/1/2014');
    expect(this.instances.fr.formatDate(testDate, 'short')).to.be.oneOf(['1/4/2014', '01/04/2014']);
  });

  it('has a format named \'medium\'', function () {
    expect(this.instances.en.formatDate(testDate, 'medium')).to.equal('Apr 1, 2014');
    expect(this.instances.fr.formatDate(testDate, 'medium')).to.equal('1 avr. 2014');
  });

  it('has a format named \'long\'', function () {
    expect(this.instances.en.formatDate(testDate, 'long')).to.equal('April 1, 2014');
    expect(this.instances.fr.formatDate(testDate, 'long')).to.equal('1 avril 2014');
  });

  it('has a format named \'full\'', function () {
    expect(this.instances.en.formatDate(testDate, 'full')).to.equal('Tuesday, April 1, 2014');
    expect(this.instances.fr.formatDate(testDate, 'full')).to.equal('mardi 1 avril 2014');
  });

  it('defaults to the medium format', function () {
    expect(this.instances.en.formatDate(testDate)).to.equal('Apr 1, 2014');
    expect(this.instances.fr.formatDate(testDate)).to.equal('1 avr. 2014');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(this.instances.en.formatDate(testDate, 'short', 'Pacific/Honolulu')).to.equal('3/31/14');
    expect(this.instances.fr.formatDate(testDate, 'short', 'Pacific/Honolulu')).to.equal('31/03/2014');
  });
});


describe('formatDateTime', function () {
  var testDate = new Date(Date.UTC(2014, 3, 1, 9, 34, 43));

  beforeEach(function (done) {
    commonSetup();
    this.instances = buildInstances(['en', 'fr'], done);
  });
  afterEach(commonTeardown);

  it('has a format named \'short\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'short')).to.equal('4/1/2014, 5:34 AM');
    expect(this.instances.fr.formatDateTime(testDate, 'short')).to.be.oneOf(['01/04/2014 à 5:34 AM', '1/4/2014 5:34 AM']);
  });

  it('has a format named \'medium\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'medium')).to.equal('Apr 1, 2014, 5:34:43 AM');
    expect(this.instances.fr.formatDateTime(testDate, 'medium')).to.be.oneOf(['1 avr. 2014 à 5:34:43 AM', '1 avr. 2014 5:34:43 AM']);
  });

  it('has a format named \'long\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'long')).to.equal('April 1, 2014, 5:34:43 AM EDT');
    expect(this.instances.fr.formatDateTime(testDate, 'long')).to.be.oneOf(['1 avril 2014 à 5:34:43 AM UTC−4', '1 avril 2014 05:34:43 UTC−4']);
  });

  it('has a format named \'full\'', function () {
    expect(this.instances.en.formatDateTime(testDate, 'full')).to.equal('Tuesday, April 1, 2014, 5:34:43 AM EDT');
    expect(this.instances.fr.formatDateTime(testDate, 'full')).to.be.oneOf(['mardi 1 avril 2014 à 5:34:43 AM UTC−4', 'mardi 1 avril 2014 05:34:43 UTC−4']);
  });

  it('defaults to the medium format', function () {
    expect(this.instances.en.formatDateTime(testDate)).to.equal('Apr 1, 2014, 5:34:43 AM');
    expect(this.instances.fr.formatDateTime(testDate)).to.be.oneOf(['1 avr. 2014 à 5:34:43 AM', '1 avr. 2014 5:34:43 AM']);
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(this.instances.en.formatDateTime(testDate, 'short', 'America/Chicago')).to.equal('4/1/2014, 4:34 AM');
    expect(this.instances.fr.formatDateTime(testDate, 'short', 'America/Chicago')).to.equal('1/4/2014 4:34 AM');
  });
});


describe('formatTime', function () {
  var testDate = new Date(Date.UTC(2014, 3, 1, 9, 34, 43));

  beforeEach(function (done) {
    commonSetup();
    this.instances = buildInstances(['en', 'fr'], done);
  });
  afterEach(commonTeardown);

  it('has a format named \'short\'', function () {
    expect(this.instances.en.formatTime(testDate, 'short')).to.equal('5:34 AM');
    expect(this.instances.fr.formatTime(testDate, 'short')).to.equal('5:34 AM');
  });

  it('has a format named \'medium\'', function () {
    expect(this.instances.en.formatTime(testDate, 'medium')).to.equal('5:34:43 AM');
    expect(this.instances.fr.formatTime(testDate, 'medium')).to.equal('5:34:43 AM');
  });

  it('has a format named \'long\'', function () {
    expect(this.instances.en.formatTime(testDate, 'long')).to.equal('5:34:43 AM EDT');
    expect(this.instances.fr.formatTime(testDate, 'long')).to.be.oneOf(['5:34:43 AM UTC−4', '05:34:43 UTC−4']);
  });

  it('has a format named \'full\'', function () {
    expect(this.instances.en.formatTime(testDate, 'full')).to.equal('5:34:43 AM EDT');
    expect(this.instances.fr.formatTime(testDate, 'full')).to.be.oneOf(['5:34:43 AM UTC−4', '05:34:43 UTC−4']);
  });

  it('defaults to the medium format', function () {
    expect(this.instances.en.formatTime(testDate)).to.equal('5:34:43 AM');
    expect(this.instances.fr.formatTime(testDate)).to.equal('5:34:43 AM');
  });

  // SKIPPED: No timezone conversion support yet.
  xit('can render as a different timezone than the one configured', function () {
    expect(this.instances.en.formatTime(testDate, 'short', 'America/Chicago')).to.equal('4:34 AM');
    expect(this.instances.fr.formatTime(testDate, 'short', 'America/Chicago')).to.equal('04:34');
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

  beforeEach(function (done) {
    commonSetup();
    ri = buildInstances(locales, done);
  });
  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
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
      'en': ['12,300%', '123%', '0%', '50%', '67%'],
      'fr': ['12\u00A0300\u00A0%', '123\u00A0%', '0\u00A0%', '50\u00A0%', '67\u00A0%']
    };

  beforeEach(function (done) {
    commonSetup();
    ri = buildInstances(locales, done);
  });
  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
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


describe('formatCurrency', function () {
  var locales = ['en', 'fr'],
    ri = {},
    l,
    i,
    vectors = [
      [123, 'USD'],
      [1.23, 'USD'],
      [0, 'USD'],
      [0.5, 'USD'],
      [0.6666667, 'USD'],
      [123, 'EUR'],
      [1.23, 'EUR'],
      [0, 'EUR'],
      [0.5, 'EUR'],
      [0.6666667, 'EUR']
    ],
    results = {
      'en': [
        '$123.00', '$1.23', '$0.00', '$0.50', '$0.67',
        '€123.00', '€1.23', '€0.00', '€0.50', '€0.67'
      ],
      'fr': [
        '123,00\u00A0$US', '1,23\u00A0$US', '0,00\u00A0$US', '0,50\u00A0$US', '0,67\u00A0$US',
        '123,00\u00A0€', '1,23\u00A0€', '0,00\u00A0€', '0,50\u00A0€', '0,67\u00A0€'
      ]
    };

  beforeEach(function (done) {
    commonSetup();
    ri = buildInstances(locales, done);
  });
  afterEach(commonTeardown);

  for (l = 0; l < locales.length; l += 1) {
    for (i = 0; i < vectors.length; i += 1) {
      (function () {
        var vector = vectors[i],
          locale = locales[l],
          result = results[locale][i];
        it('should format [' + vector + '] correctly in "' + locale + '"', function () {
          expect(ri[locale].formatCurrency(vector[0], vector[1])).to.equal(result);
        });
      }).call(this);
    }
  }
});


describe('formatScientific', function () {
  var locales = ['en', 'fr'],
    ri = {}, l;

  beforeEach(function (done) {
    commonSetup();
    ri = buildInstances(locales, done);
  });
  afterEach(commonTeardown);

  it('throws an exception because it is not implemented yet', function () {
    function shouldThrow(ri) {
      ri.formatScientific(1.23);
    }

    for (l = 0; l < locales.length; l += 1) {
      expect(shouldThrow.bind(null, ri[locales[l]])).to.throw(/Not Implemented Yet/);
    }
  });
});

