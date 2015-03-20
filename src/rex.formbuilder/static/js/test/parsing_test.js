/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.config.truncateThreshold = 0;

var elements = require('../lib/elements');
var DefinitionParser = require('../lib/DefinitionParser');


describe('Individual Elements', function () {
  describe('Divider', function () {
    var INSTRUMENT = require('./definitions/parse-divider-instrument.json');
    var FORM = require('./definitions/parse-divider-form.json');
    var LENGTH = 3;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies the element', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Divider);
    });
  });


  describe('Header', function () {
    var INSTRUMENT = require('./definitions/parse-header-instrument.json');
    var FORM = require('./definitions/parse-header-form.json');
    var LENGTH = 3;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies the element', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Header);
      expect(elm.text).to.deep.equal({
        'en': 'Header Text'
      });
    });
  });


  describe('Text', function () {
    var INSTRUMENT = require('./definitions/parse-text-instrument.json');
    var FORM = require('./definitions/parse-text-form.json');
    var LENGTH = 3;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies the element', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Text);
      expect(elm.text).to.deep.equal({
        'en': 'Just Some Text'
      });
    });
  });


  describe('ShortText', function () {
    var INSTRUMENT = require('./definitions/parse-shorttext-instrument.json');
    var FORM = require('./definitions/parse-shorttext-form.json');
    var LENGTH = 5;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.ShortText);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.ShortText);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });

    it('parses pattern prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.ShortText);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.pattern).to.equal('foo');
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
    });

    it('parses length prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[4];

      expect(elm).to.be.instanceof(elements.Questions.ShortText);
      expect(elm.id).to.equal('q_fake4');
      expect(elm.length).to.deep.equal({
        'max': 20
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question4 Text'
      });
    });
  });


  describe('LongText', function () {
    var INSTRUMENT = require('./definitions/parse-longtext-instrument.json');
    var FORM = require('./definitions/parse-longtext-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies the element', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.LongText);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('parses pattern prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.LongText);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.pattern).to.equal('foo');
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
    });

    it('parses length prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.LongText);
      expect(elm.id).to.equal('q_fake4');
      expect(elm.length).to.deep.equal({
        'max': 20
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question4 Text'
      });
    });
  });


  describe('Integer', function () {
    var INSTRUMENT = require('./definitions/parse-integer-instrument.json');
    var FORM = require('./definitions/parse-integer-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.Integer);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.Integer);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });

    it('parses range prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.Integer);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.range).to.deep.equal({
        'max': 20
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
    });
  });


  describe('Float', function () {
    var INSTRUMENT = require('./definitions/parse-float-instrument.json');
    var FORM = require('./definitions/parse-float-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.Float);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.Float);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });

    it('parses range prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.Float);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.range).to.deep.equal({
        'max': 20
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
    });
  });


  describe('Boolean', function () {
    var INSTRUMENT = require('./definitions/parse-boolean-instrument.json');
    var FORM = require('./definitions/parse-boolean-form.json');
    var LENGTH = 3;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.Boolean);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.Boolean);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });
  });


  describe('Date', function () {
    var INSTRUMENT = require('./definitions/parse-date-instrument.json');
    var FORM = require('./definitions/parse-date-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.Date);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.Date);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });

    it('parses range prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.Date);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.range).to.deep.equal({
        'max': '2014-01-01'
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
    });
  });


  describe('Time', function () {
    var INSTRUMENT = require('./definitions/parse-time-instrument.json');
    var FORM = require('./definitions/parse-time-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.Time);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.Time);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });

    it('parses range prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.Time);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.range).to.deep.equal({
        'max': '12:34:56'
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
    });
  });


  describe('DateTime', function () {
    var INSTRUMENT = require('./definitions/parse-datetime-instrument.json');
    var FORM = require('./definitions/parse-datetime-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.DateTime);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.DateTime);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
    });

    it('parses range prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.DateTime);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.range).to.deep.equal({
        'max': '2014-01-01T12:34:56'
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
    });
  });


  describe('CheckBoxGroup', function () {
    var INSTRUMENT = require('./definitions/parse-checkboxgroup-instrument.json');
    var FORM = require('./definitions/parse-checkboxgroup-form.json');
    var LENGTH = 5;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.CheckBoxGroup);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        },
        {
          'id': 'bar',
          'text': {
            'en': 'bar',
          },
          'help': {}
        }
      ]);
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.CheckBoxGroup);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        },
        {
          'id': 'bar',
          'text': {
            'en': 'bar',
          },
          'help': {}
        }
      ]);
    });

    it('parses length prop', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.CheckBoxGroup);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.length).to.deep.equal({
        'min': 1
      });
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        },
        {
          'id': 'bar',
          'text': {
            'en': 'bar',
          },
          'help': {}
        }
      ]);
    });

    it('parses mixed enumeration config', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[4];

      expect(elm).to.be.instanceof(elements.Questions.CheckBoxGroup);
      expect(elm.id).to.equal('q_fake4');
      expect(elm.text).to.deep.equal({
        'en': 'Question4 Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'bar',
          'text': {
            'en': 'Bar?',
          },
          'help': {
            'en': 'This is help.'
          }
        },
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        }
      ]);
    });
  });


  describe('RadioButtonGroup', function () {
    var INSTRUMENT = require('./definitions/parse-radiobuttongroup-instrument.json');
    var FORM = require('./definitions/parse-radiobuttongroup-form.json');
    var LENGTH = 4;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widget-less variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.RadioButtonGroup);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        },
        {
          'id': 'bar',
          'text': {
            'en': 'bar',
          },
          'help': {}
        }
      ]);
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.RadioButtonGroup);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        },
        {
          'id': 'bar',
          'text': {
            'en': 'bar',
          },
          'help': {}
        }
      ]);
    });

    it('parses mixed enumeration config', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[3];

      expect(elm).to.be.instanceof(elements.Questions.RadioButtonGroup);
      expect(elm.id).to.equal('q_fake3');
      expect(elm.text).to.deep.equal({
        'en': 'Question3 Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'bar',
          'text': {
            'en': 'Bar?',
          },
          'help': {
            'en': 'This is help.'
          }
        },
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        }
      ]);
    });
  });


  describe('DropDownMenu', function () {
    var INSTRUMENT = require('./definitions/parse-dropdownmenu-instrument.json');
    var FORM = require('./definitions/parse-dropdownmenu-form.json');
    var LENGTH = 3;

    var parser, cfg;

    beforeEach(function () {
      parser = new DefinitionParser(INSTRUMENT, FORM);
      cfg = parser.getConfiguration();
    });

    it('identifies widgeted variety', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[1];

      expect(elm).to.be.instanceof(elements.Questions.DropDownMenu);
      expect(elm.id).to.equal('q_fake');
      expect(elm.text).to.deep.equal({
        'en': 'Question Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        },
        {
          'id': 'bar',
          'text': {
            'en': 'bar',
          },
          'help': {}
        }
      ]);
    });

    it('parses mixed enumeration config', function () {
      expect(cfg.elements).to.have.length(LENGTH);
      var elm = cfg.elements[2];

      expect(elm).to.be.instanceof(elements.Questions.DropDownMenu);
      expect(elm.id).to.equal('q_fake2');
      expect(elm.text).to.deep.equal({
        'en': 'Question2 Text'
      });
      expect(elm.enumerations).to.deep.equal([
        {
          'id': 'bar',
          'text': {
            'en': 'Bar?',
          },
          'help': {
            'en': 'This is help.'
          }
        },
        {
          'id': 'foo',
          'text': {
            'en': 'foo',
          },
          'help': {}
        }
      ]);
    });
  });
});


describe('Custom Types', function () {
  var INSTRUMENT = require('./definitions/parse-customtypes-instrument.json');
  var FORM = require('./definitions/parse-customtypes-form.json');
  var LENGTH = 2;

  var parser, cfg;

  beforeEach(function () {
    parser = new DefinitionParser(INSTRUMENT, FORM);
    cfg = parser.getConfiguration();
  });

  it('identifies the element', function () {
    expect(cfg.elements).to.have.length(LENGTH);
    var elm = cfg.elements[1];

    expect(elm).to.be.instanceof(elements.Questions.ShortText);
    expect(elm.id).to.equal('q_fake');
    expect(elm.text).to.deep.equal({
      'en': 'Question Text'
    });
    expect(elm.length).to.deep.equal({
      'min': 2
    });
    expect(elm.pattern).to.equal('^[A-Z]+$');
  });
});

