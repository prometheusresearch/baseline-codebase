/**
 * @jsx React.DOM
 */
'use strict';

var sinon   = require('sinon');
var assert  = require('assert');

var ReactForms  = require('../');
var ReactCreateClass = require('create-react-class');
var React       = require('react');
var TestUtils   = require('react/lib/ReactTestUtils');

var {Form, Field, Fieldset} = ReactForms;
var {Mapping, Scalar}       = ReactForms.schema;

describe('simple form integration test', function() {

  var schema = Mapping({
    text: Scalar(),
    num: Scalar({type: 'number'})
  });

  var app;
  var form;
  var fields;
  var inputs;

  var App = ReactCreateClass({

    render: function() {
      return (
        <div>
          <Form ref="form" schema={schema} />
        </div>
      );
    }
  });

  beforeEach(function() {
    app = TestUtils.renderIntoDocument(<App />);
    form = app.refs.form;
    fields = {};
    inputs = {};
    TestUtils.scryRenderedComponentsWithType(form, Field).forEach(function(field) {
      var path = field.props.value.keyPath;
      var name = path[path.length - 1];
      fields[name] = field;
      inputs[name] = TestUtils.findRenderedDOMComponentWithTag(field, 'input');
    });
  });

  it('renders', function() {
    assert.ok(fields.text);
    assert.ok(fields.num);
    assert.ok(inputs.text);
    assert.ok(inputs.num);
  });

});

