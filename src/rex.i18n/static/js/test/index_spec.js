'use strict';


var i18n = require('../lib');


describe('setDefaultLocale / getDefaultLocale', function () {
  it('should have "en" as the initial default', function () {
    expect(i18n.getDefaultLocale()).toBe('en');
  });

  it('should allow us to set a new default', function () {
    i18n.setDefaultLocale('fr');
    expect(i18n.getDefaultLocale()).toBe('fr');
    i18n.setDefaultLocale();
    expect(i18n.getDefaultLocale()).toBe('en');
  });
});


describe('setDefaultConfiguration / getDefaultConfiguration / updateDefaultConfiguration', function () {
  it('should have an empty default', function () {
    expect(i18n.getDefaultConfiguration()).toEqual({});
  });

  it('should allow us to set a new default', function () {
    var test = {
      baseUrl: '/foo'
    };

    i18n.setDefaultConfiguration(test);
    expect(i18n.getDefaultConfiguration()).toEqual(test);
    i18n.setDefaultConfiguration({});
    expect(i18n.getDefaultConfiguration()).toEqual({});
  });

  it('should allow us to do partial updates', function () {
    var test = {
      baseUrl: '/foo'
    };
    var test2 = {
      localeUrl: '/bar'
    };

    i18n.setDefaultConfiguration(test);
    expect(i18n.getDefaultConfiguration()).toEqual(test);

    i18n.updateDefaultConfiguration(test2);
    expect(i18n.getDefaultConfiguration()).toEqual({
      baseUrl: '/foo',
      localeUrl: '/bar'
    });

    i18n.setDefaultConfiguration({});
    expect(i18n.getDefaultConfiguration()).toEqual({});
  });
});

