/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import filterFormValue from '../filterFormValue';

describe('filterFormValue', function() {

  it('filters', function() {
    let value;

    value = {};
    assert(filterFormValue(value, []) === value);

    value = {a: 42};
    assert(filterFormValue(
        value,
        [{keyPathPattern: 'a', hideIf() { return true; }}]
      ).a == null);

    value = {a: 42};
    assert(filterFormValue(
        value,
        [{keyPathPattern: 'a', hideIf() { return false; }}]
      ).a === 42);

    value = {a: 42};
    assert(filterFormValue(
        value,
        [{keyPathPattern: 'b', hideIf() { return true; }}]
      ).a === 42);
  });
});
