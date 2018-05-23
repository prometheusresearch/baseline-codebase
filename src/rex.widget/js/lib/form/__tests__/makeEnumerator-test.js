/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import makeEnumerator from '../makeEnumerator';

describe('makeEnumerator', function() {

  it('enumerates an empty pattern', function() {
    let enumerate = makeEnumerator('');
    assert.deepEqual(
      enumerate({}), [
        {
          keyPath: [],
          value: {},
          parentValue: null,
        }
      ]);
    assert.deepEqual(enumerate(null), []);
  });

  it('enumerates a simple pattern', function() {
    let enumerate = makeEnumerator('x');
    assert.deepEqual(
      enumerate({x: 42}), [
        {
          keyPath: ['x'],
          value: 42,
          parentValue: {x: 42},
        }
      ]);
  });

  it('enumerates a simple nested pattern', function() {
    let enumerate = makeEnumerator('x.y');
    assert.deepEqual(
      enumerate({x: {y: 42}}), [
        {
          keyPath: ['x', 'y'],
          value: 42,
          parentValue: {y: 42},
        }
      ]);
    assert.deepEqual(enumerate({x: null}), []);
    assert.deepEqual(enumerate({x: undefined}), []);
  });

  it('enumerates a pattern with array wildcard', function() {
    let enumerate = makeEnumerator('x.*');
    assert.deepEqual(
      enumerate({x: [1, 2, 3]}), [
        {
          keyPath: ['x', 0],
          value: 1,
          parentValue: [1, 2, 3],
        },
        {
          keyPath: ['x', 1],
          value: 2,
          parentValue: [1, 2, 3],
        },
        {
          keyPath: ['x', 2],
          value: 3,
          parentValue: [1, 2, 3],
        },
      ]);
    assert.deepEqual(enumerate({x: {}}), []);
    assert.deepEqual(enumerate({x: []}), []);
    assert.deepEqual(enumerate({x: null}), []);
    assert.deepEqual(enumerate({x: undefined}), []);
  });

  it('enumerates a pattern with nested array wildcard', function() {
    let enumerate = makeEnumerator('x.*.y');
    assert.deepEqual(
      enumerate({x: [{y: 1}, {y: 2}, {y: 3}]}), [
        {
          keyPath: ['x', 0, 'y'],
          value: 1,
          parentValue: {y: 1},
        },
        {
          keyPath: ['x', 1, 'y'],
          value: 2,
          parentValue: {y: 2},
        },
        {
          keyPath: ['x', 2, 'y'],
          value: 3,
          parentValue: {y: 3},
        },
      ]);
    assert.deepEqual(enumerate({x: {}}), []);
    assert.deepEqual(enumerate({x: []}), []);
    assert.deepEqual(enumerate({x: [{}]}), []);
    assert.deepEqual(enumerate({x: [{}, {}]}), []);
    assert.deepEqual(enumerate({x: null}), []);
    assert.deepEqual(enumerate({x: undefined}), []);
  });

});
