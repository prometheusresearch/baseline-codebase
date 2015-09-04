/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var expect = require('chai').expect;

var util = require('../lib/util');


describe('util', function () {
  describe('format', function () {
    it('works in a simple case', function () {
      expect(
        util.format('Hello ${name}', {name: 'World'})
      ).to.equal('Hello World');
    });

    it('replaces the same variable multiple times', function () {
      expect(
        util.format('Hello ${name} ${name}', {name: 'World'})
      ).to.equal('Hello World World');
    });

    it('replaces variables with nothing if not specified', function () {
      expect(
        util.format('Hello ${name}', {})
      ).to.equal('Hello ');
    });

    it('replaces variables with nothing if specified null', function () {
      expect(
        util.format('Hello ${name}', {name: null})
      ).to.equal('Hello ');
    });

    it('handles receiving no variables', function () {
      expect(
        util.format('Hello ${name}')
      ).to.equal('Hello ');
    });

    it('handles receiving falsy variable values', function () {
      expect(
        util.format('Hello ${name}', {name: 0})
      ).to.equal('Hello 0');
      expect(
        util.format('Hello ${name}', {name: false})
      ).to.equal('Hello false');
    });
  });

  describe('isEmpty', function () {
    it('should be true for null/undefined', function () {
      expect(util.isEmpty(null)).to.be.true;
      expect(util.isEmpty(undefined)).to.be.true;
    });

    it('should be true for empty string', function () {
      expect(util.isEmpty('')).to.be.true;
    });

    it('should be true for array with 0 elements', function () {
      expect(util.isEmpty([])).to.be.true;
    });

    it('should be true for an object with no properties', function () {
      expect(util.isEmpty({})).to.be.true;
    });

    it('should be false for anything else', function () {
      var tests = [
        1,
        0,
        'foo',
        {foo: 1},
        ['foo'],
        new Date(),
        true,
        false
      ];

      tests.forEach((test) => {
        expect(util.isEmpty(test), test.toString()).to.be.false;
      });
    });
  });

  describe('isEmptyLocalization', function () {
    it('should be true for null/undefined', function () {
      expect(util.isEmptyLocalization(null)).to.be.true;
      expect(util.isEmptyLocalization(undefined)).to.be.true;
    });

    it('should be true for empty string', function () {
      expect(util.isEmptyLocalization('')).to.be.true;
    });

    it('should be true for array with 0 elements', function () {
      expect(util.isEmptyLocalization([])).to.be.true;
    });

    it('should be true for an object with no properties', function () {
      expect(util.isEmptyLocalization({})).to.be.true;
    });

    it('should be true for an object with keys that have empty values', function () {
      expect(util.isEmptyLocalization({en: ''})).to.be.true;
      expect(util.isEmptyLocalization({en: null})).to.be.true;
      expect(util.isEmptyLocalization({en: null, fr: ''})).to.be.true;
    });

    it('should be false for anything else', function () {
      var tests = [
        1,
        0,
        'foo',
        {foo: 1},
        ['foo'],
        new Date(),
        true,
        false
      ];

      tests.forEach((test) => {
        expect(util.isEmptyLocalization(test), test.toString()).to.be.false;
      });
    });
  });
});

