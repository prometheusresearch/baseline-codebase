/**
 * @flow
 */

import {
  configureField,
  configureFilters,
  guessFieldTitle,
} from "../FieldLegacy.js";

describe("Testing guessFieldTitle function", function() {
  it("Should be equal to reference value after processing", function() {
    let expectation = guessFieldTitle("lowercase_written_title");

    expect(expectation).toEqual("Lowercase Written Title");
  });
});

describe("Testing configureField function", function() {
  it("Should be equal to reference value after processing", function() {
    let expectation = configureField("user");

    expect(expectation).toEqual({
      require: {
        field: "user",
        require: [],
      },
      sortable: true,
      title: "User",
    });
  });
});

describe("Testing configureFilters function", function() {
  it("Should be equal to reference value after processing", function() {
    let expectation = configureFilters([]);

    expect(expectation).toEqual(null);
  });
});
