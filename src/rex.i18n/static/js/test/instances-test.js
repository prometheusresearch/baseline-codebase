/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import {expect} from 'chai';

import * as i18n from '../lib/instances';


describe('setDefaultLocale / getDefaultLocale', function () {
  it('should have "en" as the initial default', function () {
    expect(i18n.getDefaultLocale()).to.equal('en');
  });

  it('should allow us to set a new default', function () {
    i18n.setDefaultLocale('fr');
    expect(i18n.getDefaultLocale()).to.equal('fr');
    i18n.setDefaultLocale();
    expect(i18n.getDefaultLocale()).to.equal('en');
  });
});


describe('setDefaultConfiguration / getDefaultConfiguration / updateDefaultConfiguration', function () {
  it('should have an empty default', function () {
    expect(i18n.getDefaultConfiguration()).to.deep.equal({});
  });

  it('should allow us to set a new default', function () {
    let test = {
      baseUrl: '/foo'
    };

    i18n.setDefaultConfiguration(test);
    expect(i18n.getDefaultConfiguration()).to.deep.equal(test);
    i18n.setDefaultConfiguration({});
    expect(i18n.getDefaultConfiguration()).to.deep.equal({});
  });

  it('should allow us to do partial updates', function () {
    let test = {
      baseUrl: '/foo'
    };
    let test2 = {
      localeUrl: '/bar'
    };

    i18n.setDefaultConfiguration(test);
    expect(i18n.getDefaultConfiguration()).to.deep.equal(test);

    i18n.updateDefaultConfiguration(test2);
    expect(i18n.getDefaultConfiguration()).to.deep.equal({
      baseUrl: '/foo',
      localeUrl: '/bar'
    });

    i18n.setDefaultConfiguration({});
    expect(i18n.getDefaultConfiguration()).to.deep.equal({});
  });
});

