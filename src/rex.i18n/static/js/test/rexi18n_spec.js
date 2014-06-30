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
function common_setup() {
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

function common_teardown() {
    jasmine.Ajax.uninstall();

    if (CAPTURE_LOG && global.console && global.console.log) {
        global.console.log.calls.reset();
    }
}


describe('construction', function () {
    beforeEach(common_setup);
    afterEach(common_teardown);

    it('should have known default configuration', function () {
        var ri = new i18n.RexI18N();
        expect(ri.config.locale).to.equal('en');
        expect(ri.config.timezone).to.be.ok;
        expect(ri.config.translationsBaseUrl).to.equal('/translations');
        expect(ri.config.localeBaseUrl).to.equal('/locale');
        expect(ri.config.timeout).to.equal(10000);
    });

    it('should allow specification of a timezone', function () {
        var ri = new i18n.RexI18N({timezone: 'Europe/London'});
        expect(ri.config.timezone).to.equal('Europe/London');
    });

    it('should complain if given a bogus timezone', function () {
        function make_broken() {
            var ri = new i18n.RexI18N({timezone: 'fake'});
        }
        expect(make_broken).to.throw(/Invalid timezone/);
    });

    it('should retrieve translations from the correct location', function () {
        var ri;

        ri = new i18n.RexI18N();
        expect(jasmine.Ajax.requests.filter('/translations/en').length).to.equal(1);

        ri = new i18n.RexI18N({locale: 'fr'});
        expect(jasmine.Ajax.requests.filter('/translations/fr').length).to.equal(1);

        ri = new i18n.RexI18N({translationsBaseUrl: '/somewhere'});
        expect(jasmine.Ajax.requests.filter('/somewhere/en').length).to.equal(1);

        ri = new i18n.RexI18N({translationsBaseUrl: '/somewhere', locale: 'fr'});
        expect(jasmine.Ajax.requests.filter('/somewhere/fr').length).to.equal(1);
    });

    it('should retrieve locale config from the correct location', function () {
        var ri;

        ri = new i18n.RexI18N({locale: 'es'});
        expect(jasmine.Ajax.requests.filter('/locale/es').length).to.equal(1);

        ri = new i18n.RexI18N({localeBaseUrl: '/somewhere', locale: 'zh'});
        expect(jasmine.Ajax.requests.filter('/somewhere/zh').length).to.equal(1);
    });

    it('should still work if the translations could not be retrieved', function () {
        var ri = new i18n.RexI18N({locale: 'es'});
        jasmine.Ajax.requests.filter('/translations/es')[0].response({
            'status': 404,
            'statusText': '404 Not Found'
        });
        expect(ri.gettext('hello')).to.equal('hello');
    });

    it('should still work if the translations could not be parsed', function () {
        var ri = new i18n.RexI18N({locale: 'es'});
        jasmine.Ajax.requests.filter('/translations/es')[0].response({
            'status': 200,
            'contentType': 'application/json',
            'responseText': 'asd[asd[]asda]d'
        });
        expect(ri.gettext('hello')).to.equal('hello');
    });
});


describe('gettext', function () {
    var ri_en, ri_fr;

    beforeEach(function () {
        common_setup();

        ri_en = new i18n.RexI18N({locale: 'en'});
        ri_fr = new i18n.RexI18N({locale: 'fr'});
    });

    afterEach(common_teardown);

    it('should translate a simple string', function () {
        expect(ri_en.gettext('hello')).to.equal('hello');
        expect(ri_fr.gettext('hello')).to.equal('bonjour');
    });

    it('should translate a formatted string', function () {
        var variables = {
            name: 'Bob'
        };
        expect(ri_en.gettext('hello %(name)s', variables)).to.equal('hello Bob');
        expect(ri_fr.gettext('hello %(name)s', variables)).to.equal('bonjour Bob');
    });

    it('should translate a formatted string with extra variables', function () {
        var variables = {
            name: 'Bob',
            color: 'blue'
        };
        expect(ri_en.gettext('hello %(name)s', variables)).to.equal('hello Bob');
        expect(ri_fr.gettext('hello %(name)s', variables)).to.equal('bonjour Bob');
    });

    it('should die if not given all formatting variables', function () {
        var variables = {};
        expect(function () { ri_en.gettext('hello %(name)s', variables); }).to.throw();
        expect(function () { ri_fr.gettext('hello %(name)s', variables); }).to.throw();
    });

    it('should return LazyStrings when the translations have not finished loading', function () {
        var ri_es = new i18n.RexI18N({locale: 'es'}),
            value;

        value = ri_es.gettext('hello');
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

        value = ri_es.gettext('hello %(name)s', {name: 'Bob'});
        expect(value).to.not.be.instanceof(i18n.LazyString);
        expect(value).to.equal('hola Bob');
    });
});


describe('ngettext', function () {
    var ri_en, ri_fr;

    beforeEach(function () {
        common_setup();

        ri_en = new i18n.RexI18N({locale: 'en'});
        ri_fr = new i18n.RexI18N({locale: 'fr'});
    });

    afterEach(common_teardown);

    it('should translate a simple pluralized string', function () {
        expect(ri_en.ngettext('an apple', 'some apples', 1)).to.equal('an apple');
        expect(ri_en.ngettext('an apple', 'some apples', 2)).to.equal('some apples');
        expect(ri_fr.ngettext('an apple', 'some apples', 1)).to.equal('une pomme');
        expect(ri_fr.ngettext('an apple', 'some apples', 2)).to.equal('des pommes');
    });

    it('should translate a pluralized string with the number', function () {
        expect(ri_en.ngettext('%(num)s apple', '%(num)s apples', 1)).to.equal('1 apple');
        expect(ri_en.ngettext('%(num)s apple', '%(num)s apples', 2)).to.equal('2 apples');
        expect(ri_fr.ngettext('%(num)s apple', '%(num)s apples', 1)).to.equal('1 pomme');
        expect(ri_fr.ngettext('%(num)s apple', '%(num)s apples', 2)).to.equal('2 pommes');
    });

    it('should translate a formatted pluralized string', function () {
        var variables = {
            color: 'blue'
        };
        expect(ri_en.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)).to.equal('1 blue apple');
        expect(ri_en.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)).to.equal('2 blue apples');
        expect(ri_fr.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 1, variables)).to.equal('1 blue pomme');
        expect(ri_fr.ngettext('%(num)s %(color)s apple', '%(num)s %(color)s apples', 2, variables)).to.equal('2 blue pommes');
    });

    it('should return LazyStrings when the translations have not finished loading', function () {
        var ri_es = new i18n.RexI18N({locale: 'es'}),
            value;

        value = ri_es.ngettext('an apple', 'some apples', 2);
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

        value = ri_es.ngettext('%(num)s apple', '%(num)s apples', 2);
        expect(value).to.not.be.instanceof(i18n.LazyString);
        expect(value).to.equal('2 manzanas');
    });
});


describe('formatDate', function () {
    var ri_en, ri_fr, test_date = new Date(2014, 3, 1, 9, 34, 43);

    beforeEach(function () {
        common_setup();

        ri_en = new i18n.RexI18N({locale: 'en', timezone: 'America/New_York'});
        ri_fr = new i18n.RexI18N({locale: 'fr', timezone: 'America/New_York'});
    });

    afterEach(common_teardown);

    it('has a format named \'short\'', function () {
        expect(ri_en.formatDate(test_date, 'short')).to.equal('4/1/14');
        expect(ri_fr.formatDate(test_date, 'short')).to.equal('01/04/2014');
    });

    it('has a format named \'medium\'', function () {
        expect(ri_en.formatDate(test_date, 'medium')).to.equal('Apr 1, 2014');
        expect(ri_fr.formatDate(test_date, 'medium')).to.equal('1 avr. 2014');
    });

    it('has a format named \'long\'', function () {
        expect(ri_en.formatDate(test_date, 'long')).to.equal('April 1, 2014');
        expect(ri_fr.formatDate(test_date, 'long')).to.equal('1 avril 2014');
    });

    it('has a format named \'full\'', function () {
        expect(ri_en.formatDate(test_date, 'full')).to.equal('Tuesday, April 1, 2014');
        expect(ri_fr.formatDate(test_date, 'full')).to.equal('mardi 1 avril 2014');
    });

    it('has a format named \'iso\'', function () {
        expect(ri_en.formatDate(test_date, 'iso')).to.equal('2014-04-01');
        expect(ri_fr.formatDate(test_date, 'iso')).to.equal('2014-04-01');
    });

    it('defaults to the medium format', function () {
        expect(ri_en.formatDate(test_date)).to.equal('Apr 1, 2014');
        expect(ri_fr.formatDate(test_date)).to.equal('1 avr. 2014');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('can render as a different timezone than the one configured', function () {
        expect(ri_en.formatDate(test_date, 'short', 'Pacific/Honolulu')).to.equal('3/31/14');
        expect(ri_fr.formatDate(test_date, 'short', 'Pacific/Honolulu')).to.equal('31/03/2014');
    });
});


describe('formatDateTime', function () {
    var ri_en, ri_fr, test_date = new Date(2014, 3, 1, 9, 34, 43);

    beforeEach(function () {
        common_setup();

        ri_en = new i18n.RexI18N({locale: 'en', timezone: 'America/New_York'});
        ri_fr = new i18n.RexI18N({locale: 'fr', timezone: 'America/New_York'});
    });

    afterEach(common_teardown);

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'short\'', function () {
        expect(ri_en.formatDateTime(test_date, 'short')).to.equal('4/1/2014, 5:34 AM');
        expect(ri_fr.formatDateTime(test_date, 'short')).to.equal('01/04/2014 05:34');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'medium\'', function () {
        expect(ri_en.formatDateTime(test_date, 'medium')).to.equal('Apr 1, 2014, 5:34:43 AM');
        expect(ri_fr.formatDateTime(test_date, 'medium')).to.equal('1 avr. 2014 05:34:43');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'long\'', function () {
        expect(ri_fr.formatDateTime(test_date, 'long')).to.equal('1 avril 2014 05:34 -0400');
        expect(ri_en.formatDateTime(test_date, 'long')).to.equal('April 1, 2014 5:34 AM -0400');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'full\'', function () {
        expect(ri_en.formatDateTime(test_date, 'full')).to.equal('Tuesday, April 1, 2014 5:34 AM -0400');
        expect(ri_fr.formatDateTime(test_date, 'full')).to.equal('mardi 1 avril 2014 05:34 -0400');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'iso\'', function () {
        expect(ri_en.formatDateTime(test_date, 'iso')).to.equal('2014-04-01T05:34:43-0400');
        expect(ri_fr.formatDateTime(test_date, 'iso')).to.equal('2014-04-01T05:34:43-0400');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('defaults to the medium format', function () {
        expect(ri_en.formatDateTime(test_date)).to.equal('Apr 1, 2014, 5:34:43 AM');
        expect(ri_fr.formatDateTime(test_date)).to.equal('1 avr. 2014 05:34:43');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('can render as a different timezone than the one configured', function () {
        expect(ri_en.formatDateTime(test_date, 'short', 'America/Chicago')).to.equal('4/1/2014, 4:34 AM');
        expect(ri_fr.formatDateTime(test_date, 'short', 'America/Chicago')).to.equal('01/04/2014 04:34');
    });
});


describe('formatTime', function () {
    var ri_en, ri_fr, test_date = new Date(2014, 3, 1, 9, 34, 43);

    beforeEach(function () {
        common_setup();

        ri_en = new i18n.RexI18N({locale: 'en', timezone: 'America/New_York'});
        ri_fr = new i18n.RexI18N({locale: 'fr', timezone: 'America/New_York'});
    });

    afterEach(common_teardown);

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'short\'', function () {
        expect(ri_en.formatTime(test_date, 'short')).to.equal('5:34 AM');
        expect(ri_fr.formatTime(test_date, 'short')).to.equal('05:34');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'medium\'', function () {
        expect(ri_en.formatTime(test_date, 'medium')).to.equal('5:34:43 AM');
        expect(ri_fr.formatTime(test_date, 'medium')).to.equal('05:34:43');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'long\'', function () {
        expect(ri_en.formatTime(test_date, 'long')).to.equal('5:34:43 AM -0400');
        expect(ri_fr.formatTime(test_date, 'long')).to.equal('05:34:43 -0400');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'full\'', function () {
        expect(ri_en.formatTime(test_date, 'full')).to.equal('5:34:43 AM GMT-04:00');
        expect(ri_fr.formatTime(test_date, 'full')).to.equal('05:34:43 UTC-04:00');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('has a format named \'iso\'', function () {
        expect(ri_en.formatTime(test_date, 'iso')).to.equal('05:34:43-0400');
        expect(ri_fr.formatTime(test_date, 'iso')).to.equal('05:34:43-0400');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('defaults to the medium format', function () {
        expect(ri_en.formatTime(test_date)).to.equal('5:34:43 AM');
        expect(ri_fr.formatTime(test_date)).to.equal('05:34:43');
    });

    // SKIPPED: No timezone conversion support yet.
    xit('can render as a different timezone than the one configured', function () {
        expect(ri_en.formatTime(test_date, 'short', 'America/Chicago')).to.equal('4:34 AM');
        expect(ri_fr.formatTime(test_date, 'short', 'America/Chicago')).to.equal('04:34');
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
        common_setup();

        ri = {};
        for (l = 0; l < locales.length; l += 1) {
            ri[locales[l]] = new i18n.RexI18N({locale: locales[l]});
        }
    });

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

    beforeEach(function () {
        common_setup();

        ri = {};
        for (l = 0; l < locales.length; l += 1) {
            ri[locales[l]] = new i18n.RexI18N({locale: locales[l]});
        }
    });

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
            'en': ['12,300%', '123%', '0%', '50%', '66%'],
            'fr': ['12\u00A0300\u00A0%', '123\u00A0%', '0\u00A0%', '50\u00A0%', '66\u00A0%']
        };

    beforeEach(function () {
        common_setup();

        ri = {};
        for (l = 0; l < locales.length; l += 1) {
            ri[locales[l]] = new i18n.RexI18N({locale: locales[l]});
        }
    });

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
        common_setup();

        ri = {};
        for (l = 0; l < locales.length; l += 1) {
            ri[locales[l]] = new i18n.RexI18N({locale: locales[l]});
        }
    });

    for (l = 0; l < locales.length; l += 1) {
        for (i = 0; i < vectors.length; i += 1) {
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
        common_setup();

        ri = {};
        for (l = 0; l < locales.length; l += 1) {
            ri[locales[l]] = new i18n.RexI18N({locale: locales[l]});
        }
    });

    for (l = 0; l < locales.length; l += 1) {
        for (i = 0; i < vectors.length; i += 1) {
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
        { func: 'formatDate', input: new Date(2014, 3, 1, 9, 34, 43), interim: 'Tue Apr 01 2014', final: '1/4/2014' },
        { func: 'formatDateTime', input: new Date(2014, 3, 1, 9, 34, 43), interim: 'Tue Apr 01 2014 09:34:43 GMT-0400 (EDT)', final: '1/4/2014 9:34:43' },
        { func: 'formatTime', input: new Date(2014, 3, 1, 9, 34, 43), interim: '09:34:43 GMT-0400 (EDT)', final: '9:34:43' },
        { func: 'formatNumber', input: 12345, interim: '12345', final: '12.345' },
        { func: 'formatDecimal', input: 12345, interim: '12345', final: '12.345' },
        { func: 'formatPercent', input: 12345, interim: '12345', final: '1.234.500%' }
    ];

    it('should return LazyStrings when the locale info has not finished loading', function () {
        var ri_es = new i18n.RexI18N({locale: 'es'}),
            values = [],
            check,
            i;

        for (i = 0; i < vectors.length; i += 1) {
            values[i] = ri_es[vectors[i].func](vectors[i].input);
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
            check = ri_es[vectors[i].func](vectors[i].input);
            expect(check).to.not.be.instanceof(i18n.LazyString);
            expect(check).to.equal(vectors[i].final);
        }
    });
});

