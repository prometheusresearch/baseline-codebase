/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var expect = require('chai').expect;
var deepCopy = require('deep-copy');

var DefinitionParser = require('../lib/DefinitionParser');
var errors = require('../lib/errors');


var INSTRUMENT = require('./definitions/1-instrument.json');
var FORM = require('./definitions/1-form.json');


describe('DefinitionParser', function () {
  describe('constructor', function () {
    it('expects both an instrument and at least one form', function () {
      var failures = [
        function () { new DefinitionParser(); },
        function () { new DefinitionParser(null); },
        function () { new DefinitionParser(INSTRUMENT); },
        function () { new DefinitionParser(INSTRUMENT, null); },
        function () { new DefinitionParser(INSTRUMENT, []); }
      ];

      failures.map((failure, idx) => {
        expect(failure, idx).to.throw(errors.ParsingError, /must be provided/i);
      });
    });

    it('accepts an array of forms, as long as they are identical', function () {
      var successes = [
        function () { new DefinitionParser(INSTRUMENT, [FORM]); },
        function () { new DefinitionParser(INSTRUMENT, [FORM, FORM]); },
        function () { new DefinitionParser(INSTRUMENT, [FORM, FORM, FORM]); }
      ];

      successes.map((success, idx) => {
        expect(success, idx).to.not.throw(Error);
      });

      var failures = [
        function () { new DefinitionParser(INSTRUMENT, [FORM, {}]); },
        function () { new DefinitionParser(INSTRUMENT, [FORM, FORM, {}]); }
      ];

      failures.map((failure, idx) => {
        expect(failure, idx).to.throw(errors.ParsingError, /not identical/i);
      });
    });
  });


  describe('getConfiguration', function () {
    it('finds the title', function () {
      expect(
        (new DefinitionParser(INSTRUMENT, FORM)).getConfiguration().title
      ).to.deep.equal({en: 'The Instrument Title'});

      var FORM2 = deepCopy(FORM);
      FORM2.title = {en: 'The Form Title'};
      expect(
        (new DefinitionParser(INSTRUMENT, FORM2)).getConfiguration().title
      ).to.deep.equal({en: 'The Form Title'});

      expect(
        (new DefinitionParser(INSTRUMENT, FORM2, null)).getConfiguration().title
      ).to.deep.equal({en: 'The Form Title'});
    });

    it('finds the id and version', function () {
      var configuration = (new DefinitionParser(INSTRUMENT, FORM)).getConfiguration();
      expect(configuration.id).to.equal('urn:test-instrument');
      expect(configuration.version).to.equal('1.1');
    });

    it('sets the locale', function () {
      var configuration = (new DefinitionParser(INSTRUMENT, FORM, null)).getConfiguration();
      expect(configuration.locale).to.equal('en');
    });

    it('fails on unsupported elements', function () {
      var FORM2 = deepCopy(FORM);
      FORM2.pages[0].elements.push({
        type: 'fakeElement'
      });

      var parser = new DefinitionParser(INSTRUMENT, FORM2);
      expect(
        function () { parser.getConfiguration(); }
      ).to.throw(errors.UnsupportedConfigurationError, /not currently supported/i);
    });
  });
});

