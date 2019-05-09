/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import { Mutation as BaseMutation } from "../Mutation";

describe("Mutation", function() {
  class Mutation extends BaseMutation {
    static post = jest.fn();

    prepareFormData() {
      return {
        append: jest.fn()
      };
    }
  }

  it("submits a mutation", function() {
    let mutation = new Mutation("/path", { a: "b" });
    mutation = mutation.params({ b: "c" });
    mutation.execute({ data: "new" }, { data: "old" });
    expect(Mutation.post).toBeCalledTimes(1);
    expect(Mutation.post).toBeCalledWith(
      "/path",
      { a: "b", b: "c" },
      expect.any(Object)
    );
  });
});
