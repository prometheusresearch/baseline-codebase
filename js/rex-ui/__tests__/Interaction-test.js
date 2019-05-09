/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";
import * as React from "react";
import * as ReactTesting from "react-testing-library";
import { Focusable, Hoverable } from "../Interaction";

afterEach(ReactTesting.cleanup);

describe("Focusable", function() {
  let Component = ({ focus, ...props }) => (
    <button data-testid="button" {...props}>
      {focus ? "YES" : "NO"}
    </button>
  );
  let HoverableComponent = Focusable(Component);

  it("renders underlying component and reacts on onFocus/onBlur", function() {
    let rendered = ReactTesting.render(<HoverableComponent />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <button
    data-testid="button"
  >
    NO
  </button>
</DocumentFragment>
`);

    ReactTesting.act(() => {
      ReactTesting.fireEvent.focus(rendered.getByTestId("button"));
    });

    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <button
    data-testid="button"
  >
    YES
  </button>
</DocumentFragment>
`);

    ReactTesting.act(() => {
      ReactTesting.fireEvent.blur(rendered.getByTestId("button"));
    });

    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <button
    data-testid="button"
  >
    NO
  </button>
</DocumentFragment>
`);
  });
});

describe("Hoverable", function() {
  let Component = ({ hover, ...props }) => (
    <button data-testid="button" {...props}>
      {hover ? "YES" : "NO"}
    </button>
  );
  let HoverableComponent = Hoverable(Component);

  it("renders underlying component and reacts on onMouseEnter/onMouseLeave", function() {
    let rendered = ReactTesting.render(<HoverableComponent />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <button
    data-testid="button"
  >
    NO
  </button>
</DocumentFragment>
`);

    ReactTesting.act(() => {
      ReactTesting.fireEvent.mouseEnter(rendered.getByTestId("button"));
    });

    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <button
    data-testid="button"
  >
    YES
  </button>
</DocumentFragment>
`);

    ReactTesting.act(() => {
      ReactTesting.fireEvent.mouseLeave(rendered.getByTestId("button"));
    });

    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <button
    data-testid="button"
  >
    NO
  </button>
</DocumentFragment>
`);
  });
});
