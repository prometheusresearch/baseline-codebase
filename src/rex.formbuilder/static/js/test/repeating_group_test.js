/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.config.truncateThreshold = 0;
var deepCopy = require('deep-copy');

var elements = require('../lib/elements');
var Configuration = require('../lib/Configuration');
var DefinitionParser = require('../lib/DefinitionParser');


describe('RepeatingGroup', function () {
  describe('parsing', function () {
    var INSTRUMENT = require('./definitions/parse-repeatinggroup-instrument.json');
    var FORM = require('./definitions/parse-repeatinggroup-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies the element', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.RepeatingGroup);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });

      expect(elm.questions).to.have.length(2);
      expect(elm.questions[0]).to.be.instanceof(elements.Questions.ShortText);
      expect(elm.questions[0].id).to.equal('quest1');
      expect(elm.questions[1]).to.be.instanceof(elements.Questions.Integer);
      expect(elm.questions[1].id).to.equal('quest2');
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.RepeatingGroup);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });

    it('parses props', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.RepeatingGroup);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });

      expect(elm.length).to.deep.equal({
        'max': 5
      });
      expect(elm.addLabel).to.deep.equal({
        'en': 'Add Something New'
      });
      expect(elm.removeLabel).to.deep.equal({
        'en': 'Remove a Thing'
      });
    });
  });


  describe('serializing', function () {
    var cfg, elm, subElm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.RepeatingGroup();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
      subElm = new elements.Questions.ShortText();
      subElm.id = 'bar';
      subElm.text = {'en': 'My Sub Question'};
    });

    it('can serialize basic configuration', function () {
      elm.questions.push(subElm);
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'recordList',
          'record': [
            {
              'id': 'bar',
              'type': 'text'
            }
          ]
        }
      });

      expect(form.pages).to.have.length(1);
      var page = form.pages[0];
      expect(page).to.have.all.keys(['id', 'elements']);
      expect(page).to.have.property('id', 'page1');

      expect(page.elements).to.have.length(1);
      expect(page.elements[0]).to.deep.equal({
        'type': 'question',
        'options': {
          'fieldId': 'foo',
          'text': {
            'en': 'My Question'
          },
          'questions': [
            {
              'fieldId': 'bar',
              'text': {
                'en': 'My Sub Question'
              }
            }
          ]
        }
      });
    });

    it('can serialize the length prop', function () {
      elm.questions.push(subElm);
      elm.length = {min: 5};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'recordList',
          'length': {
            'min': 5
          },
          'record': [
            {
              'id': 'bar',
              'type': 'text'
            }
          ]
        }
      });
    });

    it('can serialize the label props', function () {
      elm.questions.push(subElm);
      elm.addLabel = {en: 'Add Something'};
      elm.removeLabel = {en: 'Remove Something'};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(form.pages).to.have.length(1);
      var page = form.pages[0];
      expect(page).to.have.all.keys(['id', 'elements']);
      expect(page).to.have.property('id', 'page1');

      expect(page.elements).to.have.length(1);
      expect(page.elements[0]).to.deep.equal({
        'type': 'question',
        'options': {
          'fieldId': 'foo',
          'text': {
            'en': 'My Question'
          },
          'questions': [
            {
              'fieldId': 'bar',
              'text': {
                'en': 'My Sub Question'
              }
            }
          ],
          'widget': {
            'type': 'recordList',
            'options': {
              'addLabel': {
                'en': 'Add Something'
              },
              'removeLabel': {
                'en': 'Remove Something'
              }
            }
          }
        }
      });
    });

  });
});

