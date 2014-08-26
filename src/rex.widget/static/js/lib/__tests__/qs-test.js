/**
 * @jsx React.DOM
 */
'use strict';

var assert             = require('assert');
var {stringify, parse} = require('../qs');

describe('qs', function() {

  function assertStringifies(input, output) {
    assert.strictEqual(stringify(input), output);
  }

  it('serializes object with stringify()', function() {
    assertStringifies({}, '');
    assertStringifies({a: 1}, 'a=1');
    assertStringifies({a: 1, b: 'b'}, 'a=1&b=b');
    assertStringifies({a: 1, b: {c: 2}}, 'a=1&b.c=2');
    assertStringifies({a: 1, b: {c: {d: 2}}}, 'a=1&b.c.d=2');
    assertStringifies([], '');
    assertStringifies([1], '0=1');
    assertStringifies([1, 2], '0=1&1=2');
    assertStringifies([1, {a: 1}], '0=1&1.a=1');
    assertStringifies({a: 1, b: [1, 2]}, 'a=1&b.0=1&b.1=2');
    assertStringifies({a: ''}, '');
    assertStringifies({a: null}, '');
    assertStringifies({a: {b: null}}, '');
    assertStringifies({a: {b: ''}}, '');
    assertStringifies([], '');
    assertStringifies([{}], '');
    assertStringifies([{a: null}], '');
    assertStringifies({a: []}, '');
    assertStringifies({'a/b': 1}, 'a/b=1');
    assertStringifies({'a/b': {top: 1, skip: 2}}, 'a/b.top=1&a/b.skip=2');
  });

  function assertParses(input, output) {
    assert.deepEqual(parse(input), output);
  }

  it('parses string with parse()', function() {
    assertParses('', {});
    assertParses('a=1', {a: 1});
    assertParses('0=1', [1]);
    assertParses('a.b=1', {a: {b: 1}});
    assertParses('a.b.0=1', {a: {b: [1]}});
    assertParses('a.b.0=1&a.b.1=2', {a: {b: [1, 2]}});
    assertParses('a=1&b.0=1&b.1=2', {a: 1, b: [1, 2]});
    assertParses('a/b.top=1&a/b.skip=2', {'a/b': {top: 1, skip: 2}});
  });

});
