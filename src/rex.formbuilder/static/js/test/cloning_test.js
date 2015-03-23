/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var chai = require('chai');
var expect = chai.expect;
chai.config.truncateThreshold = 0;

var Configuration = require('../lib/Configuration');
var elements = require('../lib/elements');


function checkType(clone, original) {
  expect(clone).to.be.instanceof(original.constructor);
  expect(clone).to.not.equal(original);
}

function checkScalar(clone, original, propName) {
  expect(clone).to.have.property(propName);
  expect(original).to.have.property(propName);
  expect(clone[propName]).to.equal(original[propName]);
}

function checkObject(clone, original, propName) {
  expect(clone).to.have.property(propName);
  expect(original).to.have.property(propName);
  expect(clone[propName]).to.not.equal(original[propName]);
  expect(clone[propName]).to.deep.equal(original[propName]);
}

function checkElement(clone, original, exact) {
  checkType(clone, original);
  if (exact) {
    expect(clone.EID).to.equal(original.EID);
  } else {
    expect(clone.EID).to.not.equal(original.EID);
  }
  checkObject(clone, original, 'tags');
}

function checkQuestion(clone, original, exact) {
  checkElement(clone, original, exact);
  if (exact) {
    expect(clone.id).to.equal(original.id);
  } else {
    expect(clone.id).to.not.equal(original.id);
  }
  checkObject(clone, original, 'text');
  checkObject(clone, original, 'help');
  checkObject(clone, original, 'error');
  checkScalar(clone, original, 'required');
  checkScalar(clone, original, 'identifiable');
}


function makeElement(elementType) {
  var elm = new elementType();
  elm.tags.push('foo');
  return elm;
}

function makeQuestion(questionType) {
  var elm = new questionType();
  elm.id = 'foo';
  elm.text = { 'en': 'Hello World' };
  elm.help = { 'en': 'Help Me' };
  elm.error = { 'en': 'Error!' };
  elm.required = true;
  elm.identifiable = false;
  return elm;
}


describe('PageStart', function () {
  var elm, cfg;

  beforeEach(function () {
    elm = makeElement(elements.PageStart);
    elm.id = 'page1';
    cfg = new Configuration('my-id', '1.0', 'My Title', 'en');
  });

  it('clones', function () {
    var clone = elm.clone();
    checkElement(clone, elm, false);
    expect(clone.id).to.not.equal(elm.id);
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkElement(clone, elm, true);
    expect(clone.id).to.equal(elm.id);
  });

  it('clones within scope of a configuration', function () {
    var clone = elm.clone(false, cfg);
    checkElement(clone, elm, false);
    expect(clone.id).to.equal(elm.id + '_clone');

    cfg.elements.push(clone);

    var clone2 = elm.clone(false, cfg);
    checkElement(clone, elm, false);
    expect(clone2.id).to.equal(elm.id + '_clone_clone');
  });
});


describe('Divider', function () {
  var elm;

  beforeEach(function () {
    elm = makeElement(elements.Divider);
  });

  it('clones', function () {
    var clone = elm.clone();
    checkElement(clone, elm, false);
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkElement(clone, elm, true);
  });
});


describe('Header', function () {
  var elm;

  beforeEach(function () {
    elm = makeElement(elements.Header);
    elm.text = { 'en': 'Hello World' };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkElement(clone, elm, false);
    checkObject(clone, elm, 'text');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkElement(clone, elm, true);
    checkObject(clone, elm, 'text');
  });
});


describe('Text', function () {
  var elm;

  beforeEach(function () {
    elm = makeElement(elements.Text);
    elm.text = { 'en': 'Hello World' };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkElement(clone, elm, false);
    checkObject(clone, elm, 'text');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkElement(clone, elm, true);
    checkObject(clone, elm, 'text');
  });
});


describe('Question', function () {
  var elm, cfg;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.ShortText);
    cfg = new Configuration('my-id', '1.0', 'My Title', 'en');
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
  });

  it('clones within scope of a configuration', function () {
    cfg.elements.push(elm);

    var clone = elm.clone(false, cfg);
    checkElement(clone, elm, false);
    expect(clone.id).to.equal(elm.id + '_clone');

    cfg.elements.push(clone);

    var clone2 = elm.clone(false, cfg);
    checkElement(clone, elm, false);
    expect(clone2.id).to.equal(elm.id + '_clone_clone');
  });
});


describe('ShortText', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.ShortText);
    elm.length = { 'min': 3 };
    elm.pattern = 'foobar';
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'length');
    checkScalar(clone, elm, 'pattern');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'length');
    checkScalar(clone, elm, 'pattern');
  });
});


describe('LongText', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.LongText);
    elm.length = { 'min': 3 };
    elm.pattern = 'foobar';
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'length');
    checkScalar(clone, elm, 'pattern');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'length');
    checkScalar(clone, elm, 'pattern');
  });
});


describe('Boolean', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.Boolean);
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
  });
});


describe('Integer', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.Integer);
    elm.range = { 'min': 5 };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'range');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'range');
  });
});


describe('Float', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.Float);
    elm.range = { 'min': 5.2 };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'range');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'range');
  });
});


describe('Date', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.Date);
    elm.range = { 'min': '2010-01-01' };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'range');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'range');
  });
});


describe('Time', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.Time);
    elm.range = { 'min': '12:34:56' };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'range');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'range');
  });
});


describe('DateTime', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.DateTime);
    elm.range = { 'min': '2010-01-01T12:34:56' };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'range');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'range');
  });
});


describe('RadioButtonGroup', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.RadioButtonGroup);
    elm.enumerations = [
      {
        id: 'foo',
        text: { en: 'Foo!' },
        help: {}
      },
      {
        id: 'bar',
        text: { en: 'Bar?' },
        help: { en: 'Help Me' }
      }
    ];
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'enumerations');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'enumerations');
  });
});


describe('DropDownMenu', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.DropDownMenu);
    elm.enumerations = [
      {
        id: 'foo',
        text: { en: 'Foo!' },
        help: {}
      },
      {
        id: 'bar',
        text: { en: 'Bar?' },
        help: { en: 'Help Me' }
      }
    ];
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'enumerations');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'enumerations');
  });
});


describe('CheckBoxGroup', function () {
  var elm;

  beforeEach(function () {
    elm = makeQuestion(elements.Questions.CheckBoxGroup);
    elm.enumerations = [
      {
        id: 'foo',
        text: { en: 'Foo!' },
        help: {}
      },
      {
        id: 'bar',
        text: { en: 'Bar?' },
        help: { en: 'Help Me' }
      }
    ];
    elm.length = { max: 3 };
  });

  it('clones', function () {
    var clone = elm.clone();
    checkQuestion(clone, elm, false);
    checkObject(clone, elm, 'enumerations');
    checkObject(clone, elm, 'length');
  });

  it('clones exactly', function () {
    var clone = elm.clone(true);
    checkQuestion(clone, elm, true);
    checkObject(clone, elm, 'enumerations');
    checkObject(clone, elm, 'length');
  });
});

