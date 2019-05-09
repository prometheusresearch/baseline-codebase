/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from "assert";

import { getMaskedContext, contextToParams } from "../ContextUtils";

import { createEntity } from "../model/Entity";
import { RecordType, RowType, anytype } from "../model/Type";

describe("ContextUtils", function() {
  describe("getMaskedContext", function() {
    it("returns a piece of context described by type", function() {
      let inputType = new RecordType({
        a: new RowType("a", anytype),
        b: new RowType("b", anytype)
      });
      assert.deepEqual(getMaskedContext({}, inputType), {});
      assert.deepEqual(getMaskedContext({ a: 1, b: 2 }, inputType), {
        a: 1,
        b: 2
      });
      assert.deepEqual(getMaskedContext({ a: 1, b: 2, c: 3 }, inputType), {
        a: 1,
        b: 2
      });
      assert.deepEqual(getMaskedContext({ a: 1, b: null }, inputType), {
        a: 1
      });
    });
  });

  describe("contextToParams", function() {
    it("applies context to producible", function() {
      let inputType = new RecordType({
        value: new RowType("value", anytype),
        entity: new RowType("entity", anytype)
      });

      assert.deepEqual(contextToParams({}, inputType), {
        ":value": undefined,
        ":entity": undefined
      });

      assert.deepEqual(contextToParams({}, inputType, { query: true }), {
        value: undefined,
        entity: undefined
      });

      assert.deepEqual(contextToParams({ value: 1 }, inputType), {
        ":value": 1,
        ":entity": undefined
      });

      assert.deepEqual(
        contextToParams({ entity: createEntity("obj", 1) }, inputType),
        {
          ":value": undefined,
          ":entity": 1
        }
      );

      assert.deepEqual(contextToParams({ extra: "ok" }, inputType), {
        ":value": undefined,
        ":entity": undefined
      });
    });
  });
});
