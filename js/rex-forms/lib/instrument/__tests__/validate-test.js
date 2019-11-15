/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import assert from "assert";
import { isFieldCompleted, isEmptyValue } from "../validate";

describe("rex-forms/lib/instrument/validate", function() {
  describe("isEmptyValue", function() {
    it("returns true for null", function() {
      assert(isEmptyValue(null));
    });
    it("returns true for undefined", function() {
      assert(isEmptyValue(undefined));
    });
    it("returns true for empty array", function() {
      assert(isEmptyValue([]));
    });
    it("returns true for empty string", function() {
      assert(isEmptyValue(""));
    });
    it("returns true for an array with empty values", function() {
      assert(
        isEmptyValue([null, undefined, [], "", {}, { foo: { value: null } }]),
      );
    });
    it("returns true for empty object", function() {
      assert(isEmptyValue({}));
    });
    it("returns true for empty matrix", function() {
      assert(isEmptyValue({ foo: { bar: { value: null } } }));
    });

    it("returns false for an int", function() {
      assert(!isEmptyValue(42));
    });
    it("returns false for a string", function() {
      assert(!isEmptyValue("foo"));
    });
    it("returns false for a non-empty enumerationSet array", function() {
      assert(!isEmptyValue(["foo"]));
    });
    it("returns false for a non-empty recordList array", function() {
      assert(!isEmptyValue([{ foo: { value: 123 } }]));
    });
    it("returns false for a non-empty matrix", function() {
      assert(!isEmptyValue({ foo: { bar: { value: 42 } } }));
    });
  });

  describe("isFieldCompleted", function() {
    it("returns true for a value", function() {
      assert(
        isFieldCompleted({
          value: { value: "ok" },
          completeErrorList: [],
        }),
      );
    });

    it("returns true for an annotated empty value", function() {
      assert(
        isFieldCompleted({
          value: { annotation: "ok" },
          completeErrorList: [],
        }),
      );
    });

    it("returns false for an empty value", function() {
      assert(
        !isFieldCompleted({
          value: {},
          completeErrorList: [],
        }),
      );
    });

    it("returns false for an annotated empty value w/ errors", function() {
      assert(
        !isFieldCompleted({
          value: { annotation: "ok" },
          completeErrorList: [false],
        }),
      );
    });

    it("returns false for a value w/ errors", function() {
      assert(
        !isFieldCompleted({
          value: { value: "ok" },
          completeErrorList: [false],
        }),
      );
    });
  });
});
