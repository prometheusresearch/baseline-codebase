/**
 * @copyright 2017, Prometheus Research, LLC
 * @flow
 */

import assert from 'assert';
import {shallowEquals, shallowParamsEquals} from '../shallowEquals';

describe('shallowEquals', function() {

  function assertEquals(a, b) {
    assert(shallowEquals(a, b));
    assert(shallowEquals(b, a));
  }

  function assertNotEquals(a, b) {
    assert(!shallowEquals(a, b));
    assert(!shallowEquals(b, a));
  }

  it('compares two objects in a shallow way', function() {
    assertEquals({a: 1}, {a: 1});
    assertEquals({a: 1, b: 2}, {a: 1, b: 2});
    assertEquals({}, {});
    assertEquals(null, null);
    assertEquals(undefined, undefined);
    assertEquals(null, undefined);

    assertNotEquals({a: 1, b: 3}, {a: 1, b: 2});
    assertNotEquals({a: 1, c: 2}, {a: 1, b: 2});
    assertNotEquals({a: 1, b: 2, c: 3}, {a: 1, b: 2});
    assertNotEquals({a: 1, b: 2}, {a: 1, b: 2, c: 3});
    assertNotEquals({}, null);
    assertNotEquals({}, undefined);
  });

});

describe('shallowParamsEquals', function() {

  function assertEquals(a, b) {
    assert(shallowParamsEquals(a, b));
    assert(shallowParamsEquals(b, a));
  }

  function assertNotEquals(a, b) {
    assert(!shallowParamsEquals(a, b));
    assert(!shallowParamsEquals(b, a));
  }

  it('compares two objects in a shallow way', function() {
    assertEquals({a: 1}, {a: 1});
    assertEquals({a: 1, b: 2}, {a: 1, b: 2});
    assertEquals({}, {});
    assertEquals(null, null);
    assertEquals(undefined, undefined);
    assertEquals(null, undefined);

    assertNotEquals({a: 1, b: 3}, {a: 1, b: 2});
    assertNotEquals({a: 1, c: 2}, {a: 1, b: 2});
    assertNotEquals({a: 1, b: 2, c: 3}, {a: 1, b: 2});
    assertNotEquals({a: 1, b: 2}, {a: 1, b: 2, c: 3});
    assertNotEquals({}, null);
    assertNotEquals({}, undefined);
  });

  it('traverses into arrays', function() {
    assertEquals({a: [1]}, {a: [1]});
    assertNotEquals({a: [1, 2]}, {a: [1]});
    assertNotEquals({a: [1]}, {a: [1, 2]});
    assertNotEquals({a: [1]}, {a: 2});
  });

});
