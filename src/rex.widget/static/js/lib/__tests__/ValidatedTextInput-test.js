/**
 * @jsx React.DOM
 */
'use strict';

var assert = require('assert');
var sinon = require('sinon');
var ValidatedTextInput = require('../ValidatedTextInput');
var TestUtils = require('react/lib/ReactTestUtils');

describe('<ValidatedTextInput />', function() {

  function validateNumber(value) {
    if (!/^[0-9]+$/.exec(value)) {
      return new Error('is not a number');
    }
    return parseInt(value, 10);
  }

  function assertError(component, message) {
    var error = TestUtils.scryRenderedDOMComponentsWithClass(
      component,
      'rw-ValidatedTextInput__error'
    );
    assert.equal(error.length, 1);
    error = error[0];
    assert.equal(error.getDOMNode().innerHTML, message);
  }
  
  function assertNoError(component) {
    var error = TestUtils.scryRenderedDOMComponentsWithClass(
      component,
      'rw-ValidatedTextInput__error'
    );
    assert.equal(error.length, 0);
  }

  function assertInput(component, text) {
    var input = TestUtils.findRenderedDOMComponentWithTag(component, 'input');
    assert.equal(input.getDOMNode().value, text);
  }

  function makeInput(component, text) {
    var input = TestUtils.findRenderedDOMComponentWithTag(component, 'input');
    input.getDOMNode().value = text;
    TestUtils.SimulateNative.input(input);
    assert.equal(input.getDOMNode().value, text);
  }

  function wait(continuation) {
    setTimeout(continuation, 15);
  }

  it('works', function() {
    var onValue = sinon.spy();
    var element = <ValidatedTextInput validate={validateNumber} onValue={onValue} />;
    var component = TestUtils.renderIntoDocument(element);

    makeInput(component, '10');
    assertNoError(component);
    assert.equal(onValue.callCount, 1);
    assert.strictEqual(onValue.lastCall.args[0], 10);

    makeInput(component, '10x');
    assertError(component, 'is not a number');
    assert.equal(onValue.callCount, 1);
    assert.strictEqual(onValue.lastCall.args[0], 10);

    makeInput(component, '101');
    assertNoError(component);
    assert.equal(onValue.callCount, 2);
    assert.strictEqual(onValue.lastCall.args[0], 101);
  });

  it('is a controlled component', function() {
    var onValue = sinon.spy();
    var element = <ValidatedTextInput validate={validateNumber} onValue={onValue} />;
    var component = TestUtils.renderIntoDocument(element);

    makeInput(component, '10x');
    assertError(component, 'is not a number');
    assert.equal(onValue.callCount, 0);

    component.setProps({value: '1000'});
    assertInput(component, '1000');

    component.setProps({value: null});
    assertInput(component, '');
  });

  it('works in amortized mode', function(done) {
    var onValue = sinon.spy();
    var element = (
      <ValidatedTextInput
        amortizationEnabled
        amortizationTimeout={10}
        validate={validateNumber}
        onValue={onValue}
        />
    );
    var component = TestUtils.renderIntoDocument(element);

    makeInput(component, '10');
    wait(function() {
      assertNoError(component);
      assert.equal(onValue.callCount, 1);
      assert.strictEqual(onValue.lastCall.args[0], 10);

      makeInput(component, '10x');
      wait(function() {
        assertError(component, 'is not a number');
        assert.equal(onValue.callCount, 1);
        assert.strictEqual(onValue.lastCall.args[0], 10);

        makeInput(component, '101');
        wait(function() {
          assertNoError(component);
          assert.equal(onValue.callCount, 2);
          assert.strictEqual(onValue.lastCall.args[0], 101);
          done();
        });
      });
    });

  });

  it('is a controlled component (in amortized mode)', function() {
    var onValue = sinon.spy();
    var element = (
      <ValidatedTextInput
        amortizationEnabled
        amortizationTimeout={10}
        validate={validateNumber}
        onValue={onValue}
        />
    );
    var component = TestUtils.renderIntoDocument(element);

    makeInput(component, '10x');
    wait(function() {
      assertError(component, 'is not a number');
      assert.equal(onValue.callCount, 1);
      assert.strictEqual(onValue.lastCall.args[0], 10);

      component.setProps({value: '1000'});
      assertNoError(component);
      assertInput(component, '1000');

      component.setProps({value: null});
      assertNoError(component);
      assertInput(component, '');
    });

  });

});
