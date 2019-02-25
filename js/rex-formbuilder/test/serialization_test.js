/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.config.truncateThreshold = 0;

var Configuration = require('../lib/Configuration');
var elements = require('../lib/elements');


describe('definition metadata', function () {
  var cfg, elm;

  beforeEach(function () {
    cfg = new Configuration('my-id', '1.1', {en: 'my title'}, 'en');
  });

  it('outputs instrument metadata', function () {
    var {instrument, form} = cfg.serialize();
    expect(instrument.id).to.equal('my-id');
    expect(instrument.version).to.equal('1.1');
    expect(instrument.title).to.equal('my title');
  });

  it('outputs form metadata', function () {
    var {instrument, form} = cfg.serialize();
    expect(form.instrument.id).to.equal('my-id');
    expect(form.instrument.version).to.equal('1.1');
    expect(form.defaultLocalization).to.equal('en');
    expect(form.title.en).to.deep.equal('my title');
  });
});


describe('individual elements', function () {
  describe('Element', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Header();
      elm.text = {'en': 'Some Text'};
    });

    it('can serialize tags prop', function () {
      elm.tags = ['foo', 'bar'];
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(0);

      expect(form.pages).to.have.length(1);
      var page = form.pages[0];
      expect(page).to.have.all.keys(['id', 'elements']);
      expect(page).to.have.property('id', 'page1');

      expect(page.elements).to.have.length(1);
      expect(page.elements[0]).to.deep.equal({
        'type': 'header',
        'options': {
          'text': {
            'en': 'Some Text'
          }
        },
        'tags': ['foo', 'bar']
      });
    });
  });


  describe('Header', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Header();
      elm.text = {'en': 'Some Text'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(0);

      expect(form.pages).to.have.length(1);
      var page = form.pages[0];
      expect(page).to.have.all.keys(['id', 'elements']);
      expect(page).to.have.property('id', 'page1');

      expect(page.elements).to.have.length(1);
      expect(page.elements[0]).to.deep.equal({
        'type': 'header',
        'options': {
          'text': {
            'en': 'Some Text'
          }
        }
      });
    });
  });


  describe('Text', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Text();
      elm.text = {'en': 'Some Text'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(0);

      expect(form.pages).to.have.length(1);
      var page = form.pages[0];
      expect(page).to.have.all.keys(['id', 'elements']);
      expect(page).to.have.property('id', 'page1');

      expect(page.elements).to.have.length(1);
      expect(page.elements[0]).to.deep.equal({
        'type': 'text',
        'options': {
          'text': {
            'en': 'Some Text'
          }
        }
      });
    });
  });


  describe('Divider', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Divider();
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(0);

      expect(form.pages).to.have.length(1);
      var page = form.pages[0];
      expect(page).to.have.all.keys(['id', 'elements']);
      expect(page).to.have.property('id', 'page1');

      expect(page.elements).to.have.length(1);
      expect(page.elements[0]).to.deep.equal({
        'type': 'divider'
      });
    });
  });


  describe('PageStart', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.PageStart();
      elm.id = 'page2';
    });

    it('can serialize basic configuration', function () {
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(0);

      expect(form.pages).to.have.length(1);
      var page = form.pages[0];
      expect(page).to.have.all.keys(['id', 'elements']);
      expect(page).to.have.property('id', 'page1');

      expect(page.elements).to.have.length(0);
    });

    it('can handle multiple pages', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(0);

      expect(form.pages).to.have.length(2);
      form.pages.forEach((page, idx) => {
        expect(page).to.have.all.keys(['id', 'elements']);
        expect(page).to.have.property('id', 'page' + (idx + 1));
        expect(page.elements).to.have.length(0);
      });
    });
  });


  describe('Question', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.ShortText();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'text'
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
          }
        }
      });
    });

    it('can serialize the required prop', function () {
      elm.required = true;
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'text',
        'required': true
      });
    });

    it('can serialize the identifiable prop', function () {
      elm.identifiable = true;
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'text',
        'identifiable': true
      });
    });

    it('can serialize the help prop', function () {
      elm.help = {'en': 'This is help'};
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
          'help': {
            'en': 'This is help'
          }
        }
      });
    });

    it('can serialize the error prop', function () {
      elm.error = {'en': 'This is an error'};
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
          'error': {
            'en': 'This is an error'
          }
        }
      });
    });
  });


  describe('ShortText', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.ShortText();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'text'
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
          }
        }
      });
    });

    it('can serialize the pattern prop', function () {
      elm.pattern = 'bar';
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'text',
          'pattern': 'bar'
        }
      });
    });

    it('can serialize the length prop', function () {
      elm.length = {min: 5};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'text',
          'length': {
            'min': 5
          }
        }
      });
    });
  });


  describe('LongText', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.LongText();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'text'
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
          'widget': {
            'type': 'textArea'
          }
        }
      });
    });

    it('can serialize the pattern prop', function () {
      elm.pattern = 'bar';
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'text',
          'pattern': 'bar'
        }
      });
    });

    it('can serialize the length prop', function () {
      elm.length = {min: 5};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'text',
          'length': {
            'min': 5
          }
        }
      });
    });
  });


  describe('Integer', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.Integer();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'integer'
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
          }
        }
      });
    });

    it('can serialize the range prop', function () {
      elm.range = {min: 5};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'integer',
          'range': {
            'min': 5
          }
        }
      });
    });
  });


  describe('Float', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.Float();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'float'
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
          }
        }
      });
    });

    it('can serialize the range prop', function () {
      elm.range = {min: 5};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'float',
          'range': {
            'min': 5
          }
        }
      });
    });
  });


  describe('Boolean', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.Boolean();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'boolean'
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
          }
        }
      });
    });
  });


  describe('Date', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.Date();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'date'
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
          }
        }
      });
    });

    it('can serialize the range prop', function () {
      elm.range = {min: '2010-01-01'};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'date',
          'range': {
            'min': '2010-01-01'
          }
        }
      });
    });
  });


  describe('Time', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.Time();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'time'
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
          }
        }
      });
    });

    it('can serialize the range prop', function () {
      elm.range = {min: '12:34:56'};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'time',
          'range': {
            'min': '12:34:56'
          }
        }
      });
    });
  });


  describe('DateTime', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.DateTime();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': 'dateTime'
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
          }
        }
      });
    });

    it('can serialize the range prop', function () {
      elm.range = {min: '2010-01-01T12:34:56'};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'dateTime',
          'range': {
            'min': '2010-01-01T12:34:56'
          }
        }
      });
    });
  });


  describe('CheckBoxGroup', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.CheckBoxGroup();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
      elm.enumerations = [
        {
          id: 'baz',
          text: {'en': 'Enumeration Text'},
          help: {'en': 'Enumeration Help'}
        }
      ];
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumerationSet',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ]
        }
      });
    });

    it('can serialize the length prop', function () {
      elm.length = {min: 5};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumerationSet',
          'enumerations': {
            'baz': {}
          },
          'length': {
            'min': 5
          }
        }
      });
    });

    it('can serialize the audio prop', function () {
      elm.enumerations[0].audio = {'en': ['http://example.com/foo.mp3']};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumerationSet',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              },
              'audio': {
                'en': [
                  'http://example.com/foo.mp3'
                ]
              }
            }
          ]
        }
      });
    });

    it('can serialize the autoHotkeys prop', function () {
      elm.autoHotkeys = true;
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumerationSet',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ],
          'widget': {
            'type': 'checkGroup',
            'options': {
              'autoHotkeys': true
            }
          }
        }
      });
    });

    it('can serialize the hotkeys', function () {
      elm.enumerations[0].hotkey = '3';
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumerationSet',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ],
          'widget': {
            'type': 'checkGroup',
            'options': {
              'hotkeys': {
                'baz': '3'
              }
            }
          }
        }
      });
    });

    it('can serialize the orientation prop', function () {
      elm.horizontal = true;
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumerationSet',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ],
          'widget': {
            'type': 'checkGroup',
            'options': {
              'orientation': 'horizontal'
            }
          }
        }
      });
    });
  });


  describe('DropDownMenu', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.DropDownMenu();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
      elm.enumerations = [
        {
          id: 'baz',
          text: {'en': 'Enumeration Text'},
          help: {'en': 'Enumeration Help'}
        }
      ];
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumeration',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ],
          'widget': {
            'type': 'dropDown'
          }
        }
      });
    });
  });


  describe('RadioButtonGroup', function () {
    var cfg, elm;

    beforeEach(function () {
      cfg = new Configuration('my-id', '1.1', 'my title', 'en');
      elm = new elements.Questions.RadioButtonGroup();
      elm.id = 'foo';
      elm.text = {'en': 'My Question'};
      elm.enumerations = [
        {
          id: 'baz',
          text: {'en': 'Enumeration Text'},
          help: {'en': 'Enumeration Help'}
        }
      ];
    });

    it('can serialize basic configuration', function () {
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumeration',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ]
        }
      });
    });

    it('can serialize the audio prop', function () {
      elm.enumerations[0].audio = {'en': ['http://example.com/foo.mp3']};
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumeration',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              },
              'audio': {
                'en': [
                  'http://example.com/foo.mp3'
                ]
              }
            }
          ]
        }
      });
    });

    it('can serialize the autoHotkeys prop', function () {
      elm.autoHotkeys = true;
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumeration',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ],
          'widget': {
            'type': 'radioGroup',
            'options': {
              'autoHotkeys': true
            }
          }
        }
      });
    });

    it('can serialize the hotkeys', function () {
      elm.enumerations[0].hotkey = '3';
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumeration',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ],
          'widget': {
            'type': 'radioGroup',
            'options': {
              'hotkeys': {
                'baz': '3'
              }
            }
          }
        }
      });
    });

    it('can serialize the orientation prop', function () {
      elm.horizontal = true;
      cfg.elements.push(elm);
      var {instrument, form} = cfg.serialize();

      expect(instrument.record).to.have.length(1);
      expect(instrument.record[0]).to.deep.equal({
        'id': 'foo',
        'type': {
          'base': 'enumeration',
          'enumerations': {
            'baz': {}
          }
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
          'enumerations': [
            {
              'id': 'baz',
              'text': {
                'en': 'Enumeration Text'
              },
              'help': {
                'en': 'Enumeration Help'
              }
            }
          ],
          'widget': {
            'type': 'radioGroup',
            'options': {
              'orientation': 'horizontal'
            }
          }
        }
      });
    });
  });
});

