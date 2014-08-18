/**
 * @jsx React.DOM
 */
'use strict';

var assert = require('assert');
var TestUtils = require('react').addons.TestUtils;
var RexForm = require('../../');
var merge = require('../../lib/utils').merge;

describe('simple integration tests', function() {

  var INSTRUMENT = {
    "id": "urn:instrument",
    "version": "1.0",
    "title": "title",
    "record": [
      {
        "id": "q_number",
        "type": "integer"
      },
      {
        "id": "q_text",
        "type": "text"
      }
    ]
  };

  var FORM = {
    "instrument": {
      "id": "urn:instrument",
      "version": "1.0"
    },
    "defaultLocalization": "en",
    "pages": [
      {
        "id": "page1",
        "elements": [
          {
            "type": "header",
            "options": {
              "text": {"en": "Number"}
            }
          },
          {
            "type": "question",
            "options": {
              "fieldId": "q_number",
              "text": {"en": "Enter Number"}
            }
          },
          {
            "type": "divider",
          },
          {
            "type": "text",
            "options": {
              "text": {"en": "Number"}
            }
          },
          {
            "type": "question",
            "options": {
              "fieldId": "q_text",
              "text": {"en": "Enter text"},
            }
          }
        ]
      }
    ]
  };

  var form;

  var elements;
  var widgets;

  var qNumber;
  var qText;

  var qNumberWidget;
  var qTextWidget;

  var onChange;
  var onUpdate;
  var onComplete;

  function renderForm(options) {
    var element = document.createElement('div');
    return RexForm.render(merge({
      element,
      form: FORM,
      instrument: INSTRUMENT
    }, options));
  }

  function setupElements() {
    elements = TestUtils.scryRenderedComponentsWithType(form, RexForm.elements.Question);
    elements.forEach(function(element) {
      if (element.props.name === 'q_number') {
        qNumber = element;
      } else if (element.props.name === 'q_text') {
        qText = element;
      }
    });
  }

  function setupWidgets() {
    widgets = TestUtils.scryRenderedComponentsWithType(form, RexForm.widgets.defaultWidgetMap.inputText);
    widgets.forEach(function(widget) {
      if (widget.props.options.fieldId === 'q_number') {
        qNumberWidget = widget;
      } else if (widget.props.options.fieldId === 'q_text') {
        qTextWidget = widget;
      }
    });
  }

  function setup(props) {
    form = renderForm(props || {});
    setupElements();
    setupWidgets();
  }

  describe('rendering', function() {

    describe('rendering form', function() {

      beforeEach(function() {
        setup();
      });

      describe('form', function() {

        it('isValid() returns true', function() {
          assert.ok(form.isValid());
        });

        it('getAssessment() returns current form assessment', function() {
          var assessment = form.getAssessment();
          assert.deepEqual(assessment, {
            instrument: {
              id: INSTRUMENT.id,
              version: INSTRUMENT.version
            },
            values: {
              q_number: {value: null},
              q_text: {value: null},
            }
          });
        });

      });

      describe('questions rendering', function() {

        it('renders question elements', function() {
          assert.equal(elements.length, 2);
          assert.ok(qNumber);
          assert.ok(qText);
        });

        it('renders widgets', function() {
          assert.equal(widgets.length, 2);

          assert.ok(qNumberWidget);
          assert.ok(qTextWidget);

          assert.ok(!qTextWidget.getDOMNode().classList.contains('has-error'));
          assert.ok(!qNumberWidget.getDOMNode().classList.contains('has-error'));
        });

        it('renders inputs for values', function() {
          var qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
          var qTextInput = TestUtils.findRenderedDOMComponentWithTag(qText, 'input');
        });

        it('renders labels', function() {
          var qNumberLabel = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'label');
          var qTextLabel = TestUtils.findRenderedDOMComponentWithTag(qText, 'label');
        });
      });

      it('renders divider elements', function() {
        var elements = TestUtils.scryRenderedComponentsWithType(form, RexForm.elements.Divider);
        assert.equal(elements.length, 1);
      });

      it('renders header elements', function() {
        var elements = TestUtils.scryRenderedComponentsWithType(form, RexForm.elements.Header);
        assert.equal(elements.length, 1);
      });

      it('renders text elements', function() {
        var elements = TestUtils.scryRenderedComponentsWithType(form, RexForm.elements.Text);
        assert.equal(elements.length, 1);
      });

    });

    describe('rendering form with assessment', function() {

      var assessment = {
        instrument: {
          id: INSTRUMENT.id,
          version: INSTRUMENT.version
        },
        values: {
          q_number: {
            value: 42
          },
          q_text: {
            value: 'some text'
          }
        }
      };

      beforeEach(function() {
        setup({assessment});
      });

      describe('form', function() {

        it('isValid() returns true', function() {
          assert.ok(form.isValid());
        });

        it('getAssessment() returns current form assessment', function() {
          var assessment = form.getAssessment();
          assert.deepEqual(assessment, {
            instrument: {
              id: INSTRUMENT.id,
              version: INSTRUMENT.version
            },
            values: {
              q_number: {value: 42},
              q_text: {value: 'some text'},
            }
          });
        });

      });

      describe('question rendering', function() {

        it('renders question elements', function() {
          assert.deepEqual(qNumber.value().value, {
            value: 42
          });

          assert.deepEqual(qText.value().value, {
            value: 'some text'
          });
        });

        it('renders inputs', function() {
          var qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
          assert.equal(qNumberInput.getDOMNode().value, '42');
          var qTextInput = TestUtils.findRenderedDOMComponentWithTag(qText, 'input');
          assert.equal(qTextInput.getDOMNode().value, 'some text');
        });

      });
    });

    describe('rendering form with assessment with invalid values', function() {

      var assessment = {
        instrument: {
          id: INSTRUMENT.id,
          version: INSTRUMENT.version
        },
        values: {
          q_number: {
            value: 'invalid',
          },
          q_text: {
            value: 'some text'
          }
        }
      };

      beforeEach(function() {
        setup({assessment});
      });

      describe('form', function() {

        it('isValid() returns false', function() {
          assert.ok(!form.isValid());
        });

      });

      describe('question rendering', function() {

        it('renders question elements', function() {
          assert.deepEqual(qNumber.value().value, {
            value: 'invalid'
          });

          assert.deepEqual(qText.value().value, {
            value: 'some text'
          });
        });

        it('renders widgets', function() {
          assert.equal(widgets.length, 2);

          assert.ok(qNumberWidget);
          assert.ok(qTextWidget);

          // has no 'has-error' class because field isn't dirtied
          assert.ok(!qNumberWidget.getDOMNode().classList.contains('has-error'));
          assert.ok(!qTextWidget.getDOMNode().classList.contains('has-error'));
        });

        it('renders inputs', function() {
          var qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
          assert.equal(qNumberInput.getDOMNode().value, 'invalid');
          var qTextInput = TestUtils.findRenderedDOMComponentWithTag(qText, 'input');
          assert.equal(qTextInput.getDOMNode().value, 'some text');
        });
      });
    });

  });

  describe('behaviour on input', function() {

    describe('behaviour on valid input', function() {

      beforeEach(function() {
        setup();
      });

      function input() {
        var qTextInput = TestUtils.findRenderedDOMComponentWithTag(qText, 'input');
        TestUtils.Simulate.change(qTextInput, {target: {value: 'value'}});
      }

      it('rerenders form on input', function() {
        var qTextInput = TestUtils.findRenderedDOMComponentWithTag(qText, 'input');
        assert.equal(qTextInput.getDOMNode().value, '');
        input();
        assert.equal(qTextInput.getDOMNode().value, 'value');
      });

      it('updates assessment', function() {
        var assessment = form.getAssessment();
        assert.deepEqual(assessment, {
          instrument: {
            id: INSTRUMENT.id,
            version: INSTRUMENT.version
          },
          values: {
            q_number: {value: null},
            q_text: {value: null},
          }
        });
        input();
        assert.deepEqual(assessment, {
          instrument: {
            id: INSTRUMENT.id,
            version: INSTRUMENT.version
          },
          values: {
            q_number: {value: null},
            q_text: {value: null},
          }
        });
      });
    });

    describe('behaviour on invalid input', function() {

      beforeEach(function() {
        setup();
      });

      function input() {
        var qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
        TestUtils.Simulate.change(qNumberInput, {target: {value: 'invalid'}});
      }

      it('rerenders form on input', function() {
        var qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
        assert.equal(qNumberInput.getDOMNode().value, '');
        input();
        assert.equal(qNumberInput.getDOMNode().value, 'invalid');
      });

      it('lefts form in invalid state', function() {
        assert.ok(form.isValid());
        input();
        assert.ok(!form.isValid());
      });

      it('assigns "rex-forms-Widget--error" class to a corresponding widget', function() {
        assert.ok(!qNumberWidget.getDOMNode().classList.contains('rex-forms-Widget--error'));
        input();
        assert.ok(qNumberWidget.getDOMNode().classList.contains('rex-forms-Widget--error'));
      });

      it('renders error message', function() {
        var errorMessages = TestUtils.scryRenderedDOMComponentsWithClass(
          qNumberWidget,
          'rex-forms-Widget__error'
        );
        assert.equal(errorMessages.length, 0);
        input();
        var errorMessages = TestUtils.scryRenderedDOMComponentsWithClass(
          qNumberWidget,
          'rex-forms-Widget__error'
        );
        assert.equal(errorMessages.length, 1);
        assert.equal(
          errorMessages[0].getDOMNode().textContent,
          'Please enter a valid whole number.'
        );
      });

    });

    describe('behaviour on valid input after invalid input with invalid initial assessment', function() {

      var assessment = {
        instrument: {
          id: INSTRUMENT.id,
          version: INSTRUMENT.version
        },
        values: {
          q_number: {
            value: 'invalid',
          },
          q_text: {
            value: 'some text'
          }
        }
      };

      function invalidInput() {
        var qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
        TestUtils.Simulate.change(qNumberInput, {target: {value: 'invalid2'}});
      }

      function input() {
        var qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
        TestUtils.Simulate.change(qNumberInput, {target: {value: '43'}});
      }

      beforeEach(function() {
        setup({assessment});
      });

      it('correctly returns form.isValid()', function() {
        assert.ok(!form.isValid());
        invalidInput();
        assert.ok(!form.isValid());
        input();
        assert.ok(form.isValid());
      });

      it('correctly updates input value in DOM', function() {
        var qNumberInput;

        qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
        assert.equal(qNumberInput.getDOMNode().value, 'invalid');
        invalidInput();
        qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
        assert.equal(qNumberInput.getDOMNode().value, 'invalid2');
        input();
        qNumberInput = TestUtils.findRenderedDOMComponentWithTag(qNumber, 'input');
        assert.equal(qNumberInput.getDOMNode().value, '43');
      });

      it('correctly renders error messages', function() {
        var errorMessages;

        errorMessages = TestUtils.scryRenderedDOMComponentsWithClass(
          qNumberWidget,
          'rex-forms-Widget__error'
        );
        assert.equal(errorMessages.length, 1, 'error message should be shown');
        invalidInput();
        errorMessages = TestUtils.scryRenderedDOMComponentsWithClass(
          qNumberWidget,
          'rex-forms-Widget__error'
        );
        assert.equal(errorMessages.length, 1);
        input();
        errorMessages = TestUtils.scryRenderedDOMComponentsWithClass(
          qNumberWidget,
          'rex-forms-Widget__error'
        );
        assert.equal(errorMessages.length, 0);
      });

      it('correctly toggles "rex-forms-Widget--error" class on question element', function() {
        assert.ok(qNumberWidget.getDOMNode().classList.contains('rex-forms-Widget--error'));
        invalidInput();
        assert.ok(qNumberWidget.getDOMNode().classList.contains('rex-forms-Widget--error'));
        input();
        assert.ok(!qNumberWidget.getDOMNode().classList.contains('rex-forms-Widget--error'));
      });

    });

    it('fires "change" event on input and form is valid');
    it('fires "update" event on input');
    it('fires "complete" event when form is complete');
  });

});
