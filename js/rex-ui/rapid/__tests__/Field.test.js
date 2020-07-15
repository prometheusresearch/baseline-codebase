/**
 * @flow
 */

import { configureField, guessFieldTitle } from "../Field.js";

describe("Testing guessFieldTitle function", function() {
  it("Should be ID for id field", function() {
    let expectation = guessFieldTitle("id");

    expect(expectation).toEqual("ID");
  });

  it("Should be Column for empty field name", function() {
    let expectation = guessFieldTitle("");

    expect(expectation).toEqual("Column");
  });

  it("Should be equal to reference value after processing", function() {
    let expectation = guessFieldTitle("lowercase_written_title");

    expect(expectation).toEqual("Lowercase Written Title");
  });
});

describe("Testing configureField function", function() {
  it("Should be equal to reference value for string config", function() {
    let expectation = configureField("user");

    expect(expectation).toEqual({
      name: "user",
      title: "User",
      field: "user",
      sortable: true,
      editable: expect.any(Function),
      render: null,
      renderEdit: null,
      width: null,
    });
  });

  it("Should be equal to reference value for object config", function() {
    let field = jest.fn();
    let expectation = configureField({
      name: "is_admin",
      title: "Admin",
      field,
      sortable: true,
    });

    expect(expectation).toEqual({
      name: "is_admin",
      title: "Admin",
      field,
      sortable: true,
      render: undefined,
      renderEdit: undefined,
      edit: undefined,
      width: undefined,
      editable: expect.any(Function),
    });
  });
});
