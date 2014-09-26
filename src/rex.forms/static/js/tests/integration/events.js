/**
 * @jsx React.DOM
 */

'use strict';

var assert = require('assert');
var React = require('react');
var TestUtils = React.addons.TestUtils;
var RexForm = require('../../');
var MatrixRow = require('../../lib/widgets/matrixRow');


describe('form events', function() {
  var form;
  var element;

  function getQuestion(id) {
    return TestUtils.findRenderedDOMComponentWithClass(
      form,
      'rex-forms-Question-' + id
    );
  }

  function getWidget(id, name) {
    var question = getQuestion(id);
    return TestUtils.findRenderedDOMComponentWithClass(
      question,
      'rex-forms-Widget-' + name
    );
  }

  function getWidgetInput(id, name) {
    var widget = getWidget(id, name);
    return TestUtils.findRenderedDOMComponentWithTag(widget, 'input');
  }

  function setValue(id, value) {
    var question = getQuestion(id);
    var input = TestUtils.findRenderedDOMComponentWithTag(question, 'input');
    TestUtils.Simulate.change(input, {target: {value: value}});
  }

  function setEnumValue(id, value) {
    var question = getQuestion(id);
    var input = TestUtils.findRenderedDOMComponentWithTag(question, 'select');
    TestUtils.Simulate.change(input, {target: {value: value}});
  }

  function setEnumSetValue(id, value) {
    var question = getQuestion(id);
    var inputs = TestUtils.scryRenderedDOMComponentsWithTag(question, 'input');
    inputs.forEach((input) => {
      var node = input.getDOMNode();
      if (node.value === value) {
        node.checked = true;
        TestUtils.Simulate.change(input);
      }
    });
  }

  function clearEnumSetValue(id) {
    var question = getQuestion(id);
    var inputs = TestUtils.scryRenderedDOMComponentsWithTag(question, 'input');
    inputs.forEach((input) => {
      input.getDOMNode().checked = false;
      TestUtils.Simulate.change(input);
    });
  }

  function setMatrixValue(id, row_id, column_id, value) {
    var question = getQuestion(id);
    var rows = TestUtils.scryRenderedComponentsWithType(question, MatrixRow);
    rows.forEach((row) => {
      if (row.props.name === row_id) {
        var colquest = TestUtils.findRenderedDOMComponentWithClass(
          row,
          'rex-forms-Question-' + column_id
        );
        var input = TestUtils.findRenderedDOMComponentWithTag(colquest, 'input');
        TestUtils.Simulate.change(input, {target: {value: value}});
      }
    });
  }


  var INSTRUMENT = {
    "id": "urn:instrument",
    "version": "1.0",
    "title": "title",
    "record": [
      {
        "id": "q_in",
        "type": "integer"
      },
      {
        "id": "q_calc",
        "type": "integer"
      }
    ]
  };

  beforeEach(function() {
    element = document.createElement('div');
  });

  describe('hide', function() {
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
                "fieldId": "q_in",
                "text": {"en": "Value"}
              }
            },
            {
              "type": "question",
              "options": {
                "fieldId": "q_calc",
                "text": {"en": "Value + 2"},
                "events": [
                  {
                    "trigger": "q_in==2",
                    "action": "hide"
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    describe('hides question if value triggers on change', function() {
      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          element: element
        });
      });

      it('toggles visibility in DOM', function() {
        var qCalc = getQuestion('q_calc');
        assert.equal(qCalc.getDOMNode().style.display, 'block');
        setValue('q_in', '2');
        assert.equal(qCalc.getDOMNode().style.display, 'none');
      });

      it('does not return hidden value in assessment', function() {
        setValue('q_calc', '42');
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: null},
            q_calc: {value: 42}
          }
        });
        setValue('q_in', '2');
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 2},
            q_calc: {value: null}
          }
        });
      });
    });

    describe('hides question if initial value triggers', function() {
      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          assessment: {
            instrument: {id: INSTRUMENT.id},
            values: {
              q_calc: {value: 42},
              q_in: {value: 2}
            }
          },
          element: element
        });
      });

      it('does not show question in DOM', function() {
        var qCalc = getQuestion('q_calc');
        assert.equal(qCalc.getDOMNode().style.display, 'none');
      });

      it('does not return hidden value in assessment', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 2},
            q_calc: {value: null}
          }
        });
      });
    });

    describe('shows value back if it does not trigger on change', function() {
      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          assessment: {
            instrument: {id: INSTRUMENT.id},
            values: {
              q_in: {value: 2},
              q_calc: {value: 42}
            }
          },
          element: element
        });
      });

      it('toggles question in DOM', function() {
        var qCalc = getQuestion('q_calc');
        assert.equal(qCalc.getDOMNode().style.display, 'none');
        setValue('q_in', '3');
        assert.equal(qCalc.getDOMNode().style.display, 'block');
      });

      it('saves value in assessment', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 2},
            q_calc: {value: null}
          }
        });
        setValue('q_in', '3');
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 3},
            q_calc: {value: 42}
          }
        });
      });
    });
  });


  describe('disable', function() {
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
                "fieldId": "q_in",
                "text": {"en": "Value"}
              }
            },
            {
              "type": "question",
              "options": {
                "fieldId": "q_calc",
                "text": {"en": "Value + 2"},
                "events": [
                  {
                    "trigger": "q_in==2",
                    "action": "disable"
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    describe('disables question if value triggers on change', function() {
      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          element: element
        });
      });

      it('toggles disabled prop on input', function() {
        var qCalcInput = getWidgetInput('q_calc', 'value');
        assert.equal(qCalcInput.getDOMNode().disabled, false);
        setValue('q_in', '2');
        assert.equal(qCalcInput.getDOMNode().disabled, true);
      });

      it('does not return disabled value in assessment', function() {
        setValue('q_calc', '42');
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: null},
            q_calc: {value: 42}
          }
        });
        setValue('q_in', '2');
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 2},
            q_calc: {value: null}
          }
        });
      });
    });

    describe('disables question if initial value triggers', function() {
      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          assessment: {
            instrument: {id: INSTRUMENT.id},
            values: {
              q_in: {value: 2}
            }
          },
          element: element
        });
      });

      it('renders disabled input initially', function() {
        var qCalcInput = getWidgetInput('q_calc', 'value');
        assert.equal(qCalcInput.getDOMNode().disabled, true);
      });

      it('does not return disabled value in assessment', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 2},
            q_calc: {value: null}
          }
        });
      });
    });

    describe('shows value back if it does not trigger on change', function() {
      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          assessment: {
            instrument: {id: INSTRUMENT.id},
            values: {
              q_in: {value: 2},
              q_calc: {value: 42}
            }
          },
          element: element
        });
      });

      it('updates DOM', function() {
        var qCalcInput = getWidgetInput('q_calc', 'value');
        assert.equal(qCalcInput.getDOMNode().disabled, true);
        setValue('q_in', '3');
        assert.equal(qCalcInput.getDOMNode().disabled, false);
      });

      it('saves value in assessment', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 2},
            q_calc: {value: null}
          }
        });
        setValue('q_in', '3');
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 3},
            q_calc: {value: 42}
          }
        });
      });

    });
  });

  describe('hideEnumeration', function() {

  });

  describe('fail', function() {

  });

  describe('calculate', function() {
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
                "fieldId": "q_in",
                "text": {"en": "Value"}
              }
            },
            {
              "type": "question",
              "options": {
                "fieldId": "q_calc",
                "text": {"en": "Value + 2"},
                "events": [
                  {
                    "trigger": "true()",
                    "action": "calculate",
                    "options": {
                      "calculation": "q_in+2"
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    describe('recalculating value on change', function() {
      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          element: element
        });
      });

      it('renders correct value in DOM', function() {
        setValue('q_in', '2');
        var qCalcInput = getWidgetInput('q_calc', 'value');
        assert.equal(qCalcInput.getDOMNode().value, '4');
      });

      it('returns calculated value in assessment', function() {
        setValue('q_in', '2');
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: "urn:instrument",
            version: "1.0"
          },
          values: {
            q_in: {value: 2},
            q_calc: {value: 4}
          }
        });
      });
    });
  });


  describe('expressions', function () {
    function evaluate(expression) {
      var ctx = form.getEventExecutionContext();
      var resolver = form.getIdentifierResolver();
      return ctx.evaluate(expression, resolver);
    }

    describe('simple fields', function () {
      var INSTRUMENT = {
        "id": "urn:instrument",
        "version": "1.0",
        "title": "A Test",
        "record": [
          {
            "id": "q_text",
            "type": "text"
          },
          {
            "id": "q_float",
            "type": "float"
          },
          {
            "id": "q_int",
            "type": "integer"
          },
          {
            "id": "q_bool",
            "type": "boolean"
          },
          {
            "id": "q_enum",
            "type": {
              "base": "enumeration",
              "enumerations": {
                "red": {},
                "blue": {},
                "green": {}
              }
            }
          },
          {
            "id": "q_date",
            "type": "date"
          },
          {
            "id": "q_time",
            "type": "time"
          },
          {
            "id": "q_datetime",
            "type": "dateTime"
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
                  "fieldId": "q_text",
                  "text": {"en": "Text"}
                }
              },
              {
                "type": "question",
                "options": {
                  "fieldId": "q_float",
                  "text": {"en": "Float"}
                }
              },
              {
                "type": "question",
                "options": {
                  "fieldId": "q_int",
                  "text": {"en": "Integer"}
                }
              },
              {
                "type": "question",
                "options": {
                  "fieldId": "q_bool",
                  "text": {"en": "Boolean"},
                  "widget": {
                    "type": "dropDown"
                  }
                }
              },
              {
                "type": "question",
                "options": {
                  "fieldId": "q_enum",
                  "text": {"en": "Enumeration"},
                  "widget": {
                    "type": "dropDown"
                  }
                }
              },
              {
                "type": "question",
                "options": {
                  "fieldId": "q_date",
                  "text": {"en": "Date"}
                }
              },
              {
                "type": "question",
                "options": {
                  "fieldId": "q_time",
                  "text": {"en": "Time"}
                }
              },
              {
                "type": "question",
                "options": {
                  "fieldId": "q_datetime",
                  "text": {"en": "DateTime"}
                }
              }
            ]
          }
        ]
      };

      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          element: element
        });
      });

      it('handles text fields', function () {
        assert.equal(evaluate("q_text"), null);
        setValue('q_text', 'foobar');
        assert.equal(evaluate("q_text"), 'foobar');
        assert.equal(evaluate("q_text+'baz'"), 'foobarbaz');
        assert.equal(evaluate("q_text=='fluffy'"), false);
      });

      it('handles float fields', function () {
        assert.equal(evaluate("q_float"), null);
        setValue('q_float', '42.1');
        assert.equal(evaluate("q_float"), 42.1);
        assert.equal(evaluate("q_float+2"), 44.1);
        assert.equal(evaluate("q_float>10"), true);
      });

      it('handles integer fields', function () {
        assert.equal(evaluate("q_int"), null);
        setValue('q_int', '42');
        assert.equal(evaluate("q_int"), 42);
        assert.equal(evaluate("q_int+2"), 44);
        assert.equal(evaluate("q_int>10"), true);
      });

      it('handles boolean fields', function () {
        assert.equal(evaluate("q_bool"), null);
        setEnumValue('q_bool', 'true');
        assert.equal(evaluate("q_bool"), true);
        assert.equal(evaluate("count_true(q_bool)"), 1);
        assert.equal(evaluate("q_bool|false()"), true);
      });

      it('handles enumeration fields', function () {
        assert.equal(evaluate("q_enum"), null);
        setEnumValue('q_enum', 'green');
        assert.equal(evaluate("q_enum"), 'green');
        assert.equal(evaluate("q_enum+'baz'"), 'greenbaz');
        assert.equal(evaluate("q_enum=='fluffy'"), false);
      });

      it('handles date fields', function () {
        assert.equal(evaluate("q_date"), null);
        setValue('q_date', '2014-05-22');
        assert.equal(evaluate("q_date"), '2014-05-22');
        assert.equal(evaluate("date_diff(q_date, '2014-01-02')"), 140);
      });

      it('handles time fields', function () {
        assert.equal(evaluate("q_time"), null);
        setValue('q_time', '12:34:56');
        assert.equal(evaluate("q_time"), '12:34:56');
      });

      it('handles dateTime fields', function () {
        assert.equal(evaluate("q_datetime"), null);
        setValue('q_datetime', '2014-05-22T12:34:56');
        assert.equal(evaluate("q_datetime"), '2014-05-22T12:34:56');
        assert.equal(evaluate("date_diff(q_datetime, '2014-01-02')"), 140.52425925925925);
      });
    });


    describe('enumerationSet fields', function () {
      var INSTRUMENT = {
        "id": "urn:instrument",
        "version": "1.0",
        "title": "A Test",
        "record": [
          {
            "id": "q_enumset",
            "type": {
              "base": "enumerationSet",
              "enumerations": {
                "red": {},
                "blue": {},
                "green": {}
              }
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
                  "fieldId": "q_enumset",
                  "text": {"en": "Enumeration Set"}
                }
              }
            ]
          }
        ]
      };

      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          element: element
        });
      });

      it('can address enumerations', function () {
        setEnumSetValue('q_enumset', 'red');
        assert.equal(evaluate("q_enumset.red"), true);
        assert.equal(evaluate("q_enumset.blue"), false);
        assert.equal(evaluate("q_enumset.green"), false);

        setEnumSetValue('q_enumset', 'green');
        assert.equal(evaluate("q_enumset.red"), true);
        assert.equal(evaluate("q_enumset.blue"), false);
        assert.equal(evaluate("q_enumset.green"), true);
      });

      it('returns null if no enumeration specified', function () {
        setEnumSetValue('q_enumset', 'red');
        assert.equal(evaluate("q_enumset"), null);
      });
    });


    describe('matrix fields', function () {
      var INSTRUMENT = {
        "id": "urn:instrument",
        "version": "1.0",
        "title": "A Test",
        "record": [
          {
            "id": "q_matrix",
            "type": {
              "base": "matrix",
              "rows": [
                {
                  "id": "foo"
                },
                {
                  "id": "bar"
                }
              ],
              "columns": [
                {
                  "id": "q_text",
                  "type": "text",
                },
                {
                  "id": "q_int",
                  "type": "integer"
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
                  "fieldId": "q_matrix",
                  "text": {"en": "Matrix"},
                  "questions": [
                    {
                      "fieldId": "q_text",
                      "text": {"en": "Text"}
                    },
                    {
                      "fieldId": "q_int",
                      "text": {"en": "Integer"}
                    }
                  ],
                  "rows": [
                    {
                      "id": "foo",
                      "text": {"en": "Foo"}
                    },
                    {
                      "id": "bar",
                      "text": {"en": "Bar"}
                    }
                  ]
                }
              }
            ]
          }
        ]
      };

      beforeEach(function() {
        form = RexForm.render({
          form: FORM,
          instrument: INSTRUMENT,
          element: element
        });
      });

      it('can address subfields', function () {
        setMatrixValue('q_matrix', 'foo', 'q_text', 'red');
        setMatrixValue('q_matrix', 'bar', 'q_int', '42');
        assert.equal(evaluate("q_matrix.foo.q_text"), 'red');
        assert.equal(evaluate("q_matrix.foo.q_text+'baz'"), 'redbaz');
        assert.equal(evaluate("q_matrix.bar.q_text"), null);
        assert.equal(evaluate("q_matrix.foo.q_int"), null);
        assert.equal(evaluate("q_matrix.bar.q_int"), 42);
        assert.equal(evaluate("q_matrix.bar.q_int+10"), 52);
      });

      it('returns null if no row or column specified', function () {
        setMatrixValue('q_matrix', 'foo', 'q_text', 'red');
        assert.equal(evaluate("q_matrix"), null);
      });

      it('returns null if no column specified', function () {
        setMatrixValue('q_matrix', 'foo', 'q_text', 'red');
        assert.equal(evaluate("q_matrix.foo"), null);
      });
    });
  });
});

