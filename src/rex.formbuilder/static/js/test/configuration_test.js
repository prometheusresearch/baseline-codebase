/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var expect = require('chai').expect;
var deepCopy = require('deep-copy');

var Configuration = require('../lib/Configuration');
var {PageStart, Text, Questions} = require('../lib/elements');
var errors = require('../lib/errors');


var INSTRUMENT = require('./definitions/1-instrument.json');
var FORM = require('./definitions/1-form.json');


describe('Configuration', function () {
  describe('constructor', function () {
    it('accepts id', function () {
      var cfg = new Configuration('my-id');
      expect(cfg.id).to.equal('my-id');
      expect(cfg.version).to.not.exist;
      expect(cfg.title).to.not.exist;
      expect(cfg.locale).to.not.exist;
    });

    it('accepts id, version', function () {
      var cfg = new Configuration('my-id', '1.1');
      expect(cfg.id).to.equal('my-id');
      expect(cfg.version).to.equal('1.1');
      expect(cfg.title).to.not.exist;
      expect(cfg.locale).to.not.exist;
    });

    it('accepts id, version, title', function () {
      var cfg = new Configuration('my-id', '1.1', 'my title');
      expect(cfg.id).to.equal('my-id');
      expect(cfg.version).to.equal('1.1');
      expect(cfg.title).to.equal('my title');
      expect(cfg.locale).to.not.exist;
    });

    it('accepts id, version, title, locale', function () {
      var cfg = new Configuration('my-id', '1.1', 'my title', 'fr');
      expect(cfg.id).to.equal('my-id');
      expect(cfg.version).to.equal('1.1');
      expect(cfg.title).to.equal('my title');
      expect(cfg.locale).to.equal('fr');
    });
  });


  describe('checkValidity', function () {
    var cfg;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', {'en': 'my title'}, 'en');
    });

    it('should pass on a good configuration', function () {
      var elm = new Questions.Integer();
      elm.text = {'en': 'Test'};
      cfg.elements.push(elm);

      expect(cfg.checkValidity.bind(cfg)).to.not.throw(Error);
    });

    it('should fail if it contains no elements', function () {
      cfg.elements = [];
      expect(cfg.checkValidity.bind(cfg)).to.throw(errors.ConfigurationError, /must contain at least two/i);
    });

    it('should fail if it only contains a PageStart', function () {
      expect(cfg.checkValidity.bind(cfg)).to.throw(errors.ConfigurationError, /must contain at least two/i);
    });

    it('should fail if it doesn\'t start with a PageStart', function () {
      var elm = new Questions.Integer();
      elm.text = {'en': 'Test'};
      cfg.elements.unshift(elm);

      expect(cfg.checkValidity.bind(cfg)).to.throw(errors.ConfigurationError, /must start with a pagestart element/i);
    });

    it('should fail if it has no field-based elements', function () {
      var elm = new Text();
      elm.text = {'en': 'Test'};
      cfg.elements.push(elm);

      expect(cfg.checkValidity.bind(cfg)).to.throw(errors.ConfigurationError, /must contain at least one field-based/i);
    });

    it('should fail if it has an empty page', function () {
      var elm = new Questions.Integer();
      elm.text = {'en': 'Test'};
      cfg.elements.push(elm);

      elm = new PageStart();
      elm.id = 'test';
      cfg.elements.push(elm);

      expect(cfg.checkValidity.bind(cfg)).to.throw(errors.ConfigurationError, /page must contain at least one/i);

      cfg.elements.splice(1, 1);
      expect(cfg.checkValidity.bind(cfg)).to.throw(errors.ConfigurationError, /page must contain at least one/i);
    });
  });
});

