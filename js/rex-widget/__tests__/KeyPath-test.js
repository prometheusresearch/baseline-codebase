/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';

import * as KeyPath from '../KeyPath';

describe('KeyPath', function() {

  describe('get', function() {

    it('gets a value by key path', function() {
      assert(KeyPath.get('a.b', {a: {b: 42}}) === 42);
      assert(KeyPath.get(['a', 'b'], {a: {b: 42}}) === 42);
      assert(KeyPath.get(['a', '0'], {a: [42]}) === 42);
      assert(KeyPath.get(['a', 0], {a: [42]}) === 42);
      assert(KeyPath.get('a.0', {a: [42]}) === 42);
      assert(KeyPath.get('a.0', {}) === undefined);
    });

  });

  describe('equals', function() {

    it('compares key paths', function() {
      assert(KeyPath.equals(['a', 'b'], ['a', 'b']));
      assert(KeyPath.equals('a.b', ['a', 'b']));
      assert(KeyPath.equals(['a', '0'], ['a', '0']));
      assert(!KeyPath.equals(['a', '0'], ['a', 1]));
      assert(KeyPath.equals(['a', 0], ['a', '0']));
      assert(KeyPath.equals('a.0', ['a', '0']));
    });

  });

  describe('normalize', function() {

    it('normalizes key paths', function() {
      assert.deepEqual(KeyPath.normalize(['a', 'b']), ['a', 'b']);
      assert.deepEqual(KeyPath.normalize(['a', '0']), ['a', 0]);
      assert.deepEqual(KeyPath.normalize('a.0'), ['a', 0]);
      assert.deepEqual(KeyPath.normalize(null), []);
    });

  });

});
