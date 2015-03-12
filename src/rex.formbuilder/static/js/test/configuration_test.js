/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var expect = require('chai').expect;
var deepCopy = require('deep-copy');

var Configuration = require('../lib/Configuration');
var {PageStart, Questions} = require('../lib/elements');
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


  describe('serialize', function () {
    it('works', function () {
      var cfg = new Configuration('urn:hello', '1.0', 'Hello', 'en');

      var elm = new PageStart();
      elm.id = 'page1';
      cfg.elements.push(elm);

      elm = new Questions.LongText();
      elm.id = 'first_field';
      cfg.elements.push(elm);

      var {instrument, form} = cfg.serialize();
      // TODO
    });
  });
});

