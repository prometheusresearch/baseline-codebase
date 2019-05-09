/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import assert from 'assert';
import DataSet from "../DataSet";

test("allows to query length", function() {
  let data;
  data = new DataSet("dataset", [], null, false, false);
  assert(data.length === 0);
  data = new DataSet("dataset", null, null, false, false);
  assert(data.length === 0);
  data = new DataSet("dataset", [1, 2], null, false, false);
  assert(data.length === 2);
});

test("can be created from an array", function() {
  let data = DataSet.fromData([1, 2, 3]);
  assert.deepEqual(data.data, [1, 2, 3]);
  assert(!data.hasMore);
  assert(!data.updating);
});

test("has modifier for data", function() {
  let data = DataSet.fromData([1, 2, 3]);
  assert.deepEqual(data.data, [1, 2, 3]);
  // $FlowFixMe: ...
  data = data.setData([1, 2]);
  assert.deepEqual(data.data, [1, 2]);
});

test("has modifier for hasMore flag", function() {
  let data = DataSet.fromData([1, 2, 3]);
  assert(!data.hasMore);
  data = data.setHasMore(true);
  assert(data.hasMore);
});

test("has modifier for updating flag", function() {
  let data = DataSet.fromData([1, 2, 3]);
  assert(!data.updating);
  data = data.setUpdating(true);
  assert(data.updating);
});
