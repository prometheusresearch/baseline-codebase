/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";
import { render } from "../ObjectTemplate";
import { createEntity } from "../model/Entity";

describe("ObjectTemplate", function() {
  it("renders JSON object", function() {
    assert.deepEqual(render({ val: "$a", x: 1 }, { a: 42 }), { val: 42, x: 1 });
    assert.deepEqual(
      render({ val: "$a", x: 1 }, { a: createEntity("individual", 42) }),
      {
        val: 42,
        x: 1
      }
    );
    assert.deepEqual(render({ val: "$a", x: { val: "$a" } }, { a: 42 }), {
      val: 42,
      x: { val: 42 }
    });
    assert.deepEqual(render([{ val: "$a" }], { a: 42 }), [{ val: 42 }]);
    assert.deepEqual(render([{}], { a: 42 }), []);
    assert.deepEqual(render([{ a: null }], { a: 42 }), []);
    assert.throws(() => render(null, { a: 42 }));
  });
});
