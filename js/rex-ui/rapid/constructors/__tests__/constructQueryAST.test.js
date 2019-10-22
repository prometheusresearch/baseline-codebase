import { constructQueryAST } from "../constructQueryAST";

describe("Errors thrown", function() {
  it("Should throw if props are null", function() {
    expect(() => constructQueryAST()).toThrow();
  });

  it("Should throw if schema and path are null", function() {
    expect(() => constructQueryAST({})).toThrow();
  });
});
