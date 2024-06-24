let fn = (str: string): string => str;

describe("This is a simple test", () => {
  test("Check the fn returns", () => {
    expect(fn("hello")).toEqual("hello");
  });
});
