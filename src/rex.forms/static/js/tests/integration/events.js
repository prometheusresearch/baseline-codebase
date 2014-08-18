/**
 * @jsx React.DOM
 */
'use strict';

var assert = require('assert');
var React = require('react');
var TestUtils = React.addons.TestUtils;
var RexForm = require('../../');

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
                    "trigger": "q_in.value==2",
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
                    "trigger": "q_in.value==2",
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

});
