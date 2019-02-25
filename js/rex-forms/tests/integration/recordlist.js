/**
 * @jsx React.DOM
 */
'use strict';

var assert = require('assert');
var TestUtils = require('react').addons.TestUtils;
var RexForm = require('../../');
var merge = require('../../lib/utils').merge;

describe('recordList integration tests', function() {

  var INSTRUMENT = {
    "id": "urn:instrument",
    "version": "1.0",
    "title": "title",
    "record": [
      {
        "id": "q_list",
        "type": {
          "base": "recordList",
          "record": [
            {
              "id": "q_thing",
              "type": "text"
            },
            {
              "id": "q_like",
              "type": "text"
            }
          ]
        }
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
            "type": "question",
            "options": {
              "fieldId": "q_list",
              "text": {
                "en": "List all your favourite things"
              },
              "questions": [
                {
                  "fieldId": "q_thing",
                  "text": {
                    "en": "What do you like?"
                  },
                },
                {
                  "fieldId": "q_like",
                  "text": {
                    "en": "How much do you like it?"
                  },
                }
              ]
            }
          }
        ]
      }
    ]
  };

  var form;

  var elements;
  var widgets;

  var qList;
  var qThing;
  var qLike;

  var qThingWidget;
  var qLikeWidget;

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
      switch (element.props.name) {
        case 'q_list':
          qList = element;
          break;
        case 'q_thing':
          qThing = element;
          break;
        case 'q_like':
          qLike= element;
          break;
        default:
          assert.ok(false, 'unknown question: ' + element.props.name);
      }
    });
  }

  function setupWidgets() {
    widgets = TestUtils.scryRenderedComponentsWithType(form, RexForm.widgets.defaultWidgetMap.inputText);
    qThingWidget = [];
    qLikeWidget = [];
    widgets.forEach(function(widget) {
      switch (widget.props.options.fieldId) {
        case 'q_thing':
          qThingWidget.push(widget);
          break;
        case 'q_like':
          qLikeWidget.push(widget);
          break;
        default:
          assert.ok(false, 'unknown widget: ' + widget.options.fieldId);
      }
    });
  }

  function setup(props) {
    form = renderForm(props || {});
    setupElements();
    setupWidgets();
  }

  describe('rendering', function() {

    describe('rendering with no initial asssessment value', function() {

      beforeEach(function() {
        setup();
      });

      it('renders form with recordList', function() {
        assert.equal(elements.length, 1);
        assert.equal(widgets.length, 0);

        assert.ok(qList);
      });

      it('has correct asssessment value', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: INSTRUMENT.id,
            version: INSTRUMENT.version
          },
          values: {
            q_list: {value: null}
          }
        });
      });

    });

    describe('rendering with initial asssessment value', function() {

      var assessment = {
        instrument: {
          id: INSTRUMENT.id,
          version: INSTRUMENT.version
        },
        values: {
          q_list: {
            value: [
              {
                q_thing: {value: 'thing1'},
                q_like: {value: 'like1'}
              },
              {
                q_thing: {value: 'thing2'},
                q_like: {value: 'like2'}
              }
            ]
          }
        }
      };

      beforeEach(function() {
        setup({assessment});
      });

      it('renders form with recordList', function() {
        assert.equal(elements.length, 5);
        assert.equal(widgets.length, 4);

        assert.ok(qList);

        assert.equal(qThingWidget[0].value().value, 'thing1');
        assert.equal(qThingWidget[1].value().value, 'thing2');

        assert.equal(qLikeWidget[0].value().value, 'like1');
        assert.equal(qLikeWidget[1].value().value, 'like2');
      });

      it('has correct assessment value', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: INSTRUMENT.id,
            version: INSTRUMENT.version
          },
          values: {
            q_list: {
              value:[
                {
                  q_thing: {value: 'thing1'},
                  q_like: {value: 'like1'}
                },
                {
                  q_thing: {value: 'thing2'},
                  q_like: {value: 'like2'}
                }
              ]
            }
          }
        });
      });
    });

    describe('interacting with recordList', function() {

      var assessment = {
        instrument: {
          id: INSTRUMENT.id,
          version: INSTRUMENT.version
        },
        values: {
          q_list: {
            value: [
              {
                q_thing: {value: 'thing1'},
                q_like: {value: 'like1'}
              }
            ]
          }
        }
      };

      beforeEach(function() {
        setup({assessment});
      });

      it('adds a new value with empty fields on add button click', function() {
        assert.equal(elements.length, 3);
        assert.equal(widgets.length, 2);

        var button = TestUtils.findRenderedDOMComponentWithClass(
          qList,
          'rex-forms-recordList__add'
        );

        TestUtils.Simulate.click(button);

        setupElements();
        setupWidgets();

        assert.equal(elements.length, 5);
        assert.equal(widgets.length, 4);

        assert.equal(qThingWidget[0].value().value, 'thing1');
        assert.equal(qLikeWidget[0].value().value, 'like1');

        assert.equal(qThingWidget[1].value().value, null);
        assert.equal(qLikeWidget[1].value().value, null);
      });

      it('removes a value on button on remove button click', function() {
        assert.equal(elements.length, 3);
        assert.equal(widgets.length, 2);

        var button = TestUtils.findRenderedDOMComponentWithClass(
          qList,
          'rex-forms-recordList__remove'
        );

        TestUtils.Simulate.click(button);

        setupElements();
        setupWidgets();

        assert.equal(elements.length, 1);
        assert.equal(widgets.length, 0);
      });

      it('changes value on input', function() {
        var qThingInput = TestUtils.findRenderedDOMComponentWithTag(
          qThingWidget[0],
          'input'
        );

        TestUtils.Simulate.change(qThingInput, {target: {value: 'thing12'}});

        setupElements();
        setupWidgets();

        assert.equal(qThingWidget[0].value().value, 'thing12');
        assert.equal(qLikeWidget[0].value().value, 'like1');

        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: INSTRUMENT.id,
            version: INSTRUMENT.version
          },
          values: {
            q_list: {
              value:[
                {
                  q_thing: {value: 'thing12'},
                  q_like: {value: 'like1'}
                }
              ]
            }
          }
        });
      });
    });
  });

  describe('events', function() {
    beforeEach(function() {
      setup();
    });

    function evaluate(expression) {
      var ctx = form.getEventExecutionContext();
      var resolver = form.getIdentifierResolver();
      return ctx.evaluate(expression, resolver);
    }

    function addRecord() {
      var button = TestUtils.findRenderedDOMComponentWithClass(
        qList,
        'rex-forms-recordList__add'
      );
      TestUtils.Simulate.click(button);
      setupElements();
      setupWidgets();
    }

    function setRecordValue(recordIndex, fieldID, value) {
      var qWidget = (fieldID === 'q_thing') ? qThingWidget : qLikeWidget;
      var qInput = TestUtils.findRenderedDOMComponentWithTag(
        qWidget[recordIndex],
        'input'
      );
      TestUtils.Simulate.change(qInput, {target: {value: value}});
    }

    it('root field references returns null', function () {
      assert.equal(evaluate('q_list'), null);

      addRecord();
      assert.equal(evaluate('q_list'), null);
    });

    it('field references return null when no records', function () {
      assert.equal(evaluate('q_list.q_thing'), null);
      assert.equal(evaluate('q_list.q_like'), null);
    });

    it('field references return a list when there are records', function () {
      assert.equal(evaluate('q_list.q_thing'), null);
      assert.equal(evaluate('q_list.q_like'), null);

      addRecord();
      assert.deepEqual(evaluate('q_list.q_thing'), [null]);
      assert.deepEqual(evaluate('q_list.q_like'), [null]);

      setRecordValue(0, 'q_thing', 'foo');
      setRecordValue(0, 'q_like', 'bar');
      assert.deepEqual(evaluate('q_list.q_thing'), ['foo']);
      assert.deepEqual(evaluate('q_list.q_like'), ['bar']);

      addRecord();
      setRecordValue(1, 'q_like', 'baz');
      assert.deepEqual(evaluate('q_list.q_thing'), ['foo', null]);
      assert.deepEqual(evaluate('q_list.q_like'), ['bar', 'baz']);
    });
  });

});

