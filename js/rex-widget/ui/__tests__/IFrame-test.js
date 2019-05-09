/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";
import * as React from "react";
import * as ReactTesting from "react-testing-library";
import IFrame from "../IFrame";

afterEach(ReactTesting.cleanup);

describe("<IFrame />", function() {
  it("renders", function() {
    let rendered = ReactTesting.render(<IFrame src="/path" />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <iframe
    border="0"
    frameborder="0"
    height="100%"
    src="/path"
    style="position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px;"
    width="100%"
  />
</DocumentFragment>
`);
  });

  it("renders with params", function() {
    let rendered = ReactTesting.render(
      <IFrame src="/path" params={{ a: "b" }} />
    );
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <iframe
    border="0"
    frameborder="0"
    height="100%"
    src="/path?a=b"
    style="position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px;"
    width="100%"
  />
</DocumentFragment>
`);
  });
});
