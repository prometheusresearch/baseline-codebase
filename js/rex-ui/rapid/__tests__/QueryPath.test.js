/**
 * @flow
 */

import { make } from "../QueryPath";

describe("Testing QueryPath.make function", function() {
  it("Should be equal to reference value after processing array", function() {
    let expectation = make(["user", "paginated"]);
    expect(expectation).toEqual(["user", "paginated"]);
  });

  it("Should be equal to reference value after processing string", function() {
    let expectation = make("user.paginated");
    expect(expectation).toEqual(["user", "paginated"]);
  });
});
