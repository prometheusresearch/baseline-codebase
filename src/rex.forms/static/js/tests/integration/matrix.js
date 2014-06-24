/**
 * @jsx React.DOM
 */
'use strict';

var assert = require('assert');
var TestUtils = require('react').addons.TestUtils;
var RexForm = require('../../');
var merge = require('../../lib/utils').merge;

describe('matrix integration tests', function() {

  var INSTRUMENT = {
    "id": "urn:instrument",
    "version": "1.0",
    "title": "title",
    "record": [
      {
        "id": "q_matrix",
        "type": {
          "base": "matrix",
          "columns": [
            {
              "id": "q_blah",
              "type": "text"
            },
            {
              "id": "q_foobar",
              "type": "text"
            }
          ],
          "rows": [
            {
              "id": "somerow"
            },
            {
              "id": "anotherrow"
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
              "text": {
                "en": "Now try to fill every question in the matrix"
              },
              "questions": [
                {
                  "fieldId": "q_blah",
                  "text": {
                    "en": "Blah?"
                  },
                },
                {
                  "fieldId": "q_foobar",
                  "text": {
                    "en": "Foobar?"
                  },
                }
              ],
              "rows": [
                {
                  "id": "somerow",
                  "text": {"en": "Some Row"}
                },
                {
                  "id": "anotherrow",
                  "text": {"en": "Another Row"},
                  "help": {"en": "Enter values for another row"}
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

  var qMatrix;
  var qBlah;
  var qFoobar;

  var qBlahWidget;
  var qFoobarWidget;

  function renderForm(options) {
    var element = document.createElement('div');
    return RexForm.render(merge({
      element,
      form: FORM,
      instrument: INSTRUMENT
    }, options));
  }

  function setupElements() {
    qBlah = [];
    qFoobar = []
    elements = TestUtils.scryRenderedComponentsWithType(form, RexForm.elements.Question);
    elements.forEach(function(element) {
      switch (element.props.name) {
        case 'q_matrix':
          qMatrix = element;
          break;
        case 'q_blah':
          qBlah.push(element);
          break;
        case 'q_foobar':
          qFoobar.push(element);
          break;
        default:
          assert.ok(false, 'unknown question: ' + element.props.name);
      }
    });
  }

  function setupWidgets() {
    widgets = TestUtils.scryRenderedComponentsWithType(form, RexForm.widgets.defaultWidgetMap.inputText);
    qBlahWidget = [];
    qFoobarWidget = [];
    widgets.forEach(function(widget) {
      switch (widget.props.options.fieldId) {
        case 'q_blah':
          qBlahWidget.push(widget);
          break;
        case 'q_foobar':
          qFoobarWidget.push(widget);
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
        assert.equal(elements.length, 5);
        assert.equal(widgets.length, 4);

        assert.ok(qMatrix);
      });

      it('has correct asssessment value', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: INSTRUMENT.id,
            version: INSTRUMENT.version
          },
          values: {
            q_matrix: {value: null}
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
          q_matrix: {
            value: {
              somerow: {
                q_blah: {value: 'blah:somerow'},
                q_foobar: {value: 'foobar:somerow'}
              },
              anotherrow: {
                q_blah: {value: 'blah:anotherrow'},
                q_foobar: {value: 'foobar:anotherrow'}
              }
            }
          }
        }
      };

      beforeEach(function() {
        setup({assessment});
      });

      it('renders form with recordList', function() {
        assert.equal(elements.length, 5);
        assert.equal(widgets.length, 4);

        assert.ok(qMatrix);

        assert.equal(qBlahWidget[0].value().value, 'blah:somerow');
        assert.equal(qBlahWidget[1].value().value, 'blah:anotherrow');

        assert.equal(qFoobarWidget[0].value().value, 'foobar:somerow');
        assert.equal(qFoobarWidget[1].value().value, 'foobar:anotherrow');
      });

      it('has correct assessment value', function() {
        assert.deepEqual(form.getAssessment(), {
          instrument: {
            id: INSTRUMENT.id,
            version: INSTRUMENT.version
          },
          values: {
            q_matrix: {
              value: {
                somerow: {
                  q_blah: {value: 'blah:somerow'},
                  q_foobar: {value: 'foobar:somerow'}
                },
                anotherrow: {
                  q_blah: {value: 'blah:anotherrow'},
                  q_foobar: {value: 'foobar:anotherrow'}
                }
              }
            }
          }
        });
      });
    });

  });

  describe('interacting with matrix', function() {

    var assessment = {
      instrument: {
        id: INSTRUMENT.id,
        version: INSTRUMENT.version
      },
      values: {
        q_matrix: {
          value: {
            somerow: {
              q_blah: {value: 'blah:somerow'},
              q_foobar: {value: 'foobar:somerow'}
            },
            anotherrow: {
              q_blah: {value: 'blah:anotherrow'},
              q_foobar: {value: 'foobar:anotherrow'}
            }
          }
        }
      }
    };

    beforeEach(function() {
      setup({assessment});
    });

    it('changes form value on input', function() {
      var input = TestUtils.findRenderedDOMComponentWithTag(
        qBlahWidget[0],
        'input'
      );

      TestUtils.Simulate.change(input, {target: {value: 'changed!!!'}});

      setupElements();
      setupWidgets();

      assert.equal(qBlahWidget[0].value().value, 'changed!!!');
      assert.equal(qBlahWidget[1].value().value, 'blah:anotherrow');

      assert.equal(qFoobarWidget[0].value().value, 'foobar:somerow');
      assert.equal(qFoobarWidget[1].value().value, 'foobar:anotherrow');

      assert.deepEqual(form.getAssessment(), {
        instrument: {
          id: INSTRUMENT.id,
          version: INSTRUMENT.version
        },
        values: {
          q_matrix: {
            value: {
              somerow: {
                q_blah: {value: 'changed!!!'},
                q_foobar: {value: 'foobar:somerow'}
              },
              anotherrow: {
                q_blah: {value: 'blah:anotherrow'},
                q_foobar: {value: 'foobar:anotherrow'}
              }
            }
          }
        }
      });
    });

  });

});
