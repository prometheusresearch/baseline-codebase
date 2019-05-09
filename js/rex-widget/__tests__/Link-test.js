/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";
import * as React from "react";
import * as ReactTesting from "react-testing-library";
import * as TestHarness from "rex-ui/TestHarness";
import { Link } from "../Link";
import { mockMountPoints, unmockMountPoints } from "../resolveURL";

describe("Link", function() {
  TestHarness.silenceConsoleError();

  beforeEach(function() {
    mockMountPoints({
      pkg: "/pkgpath"
    });
  });

  afterEach(function() {
    unmockMountPoints();
  });

  it("renders an anchor element with an absolute URL", function() {
    let rendered = ReactTesting.render(<Link href="http://rexdb.com" />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <a
    href="http://rexdb.com"
  />
</DocumentFragment>
`);
  });

  it("renders an anchor element with a relative path", function() {
    let rendered = ReactTesting.render(<Link href="./" />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <a
    href="./"
  />
</DocumentFragment>
`);
  });

  it("renders an anchor element with a path with params", function() {
    let rendered = ReactTesting.render(<Link href="./" params={{ a: "b" }} />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <a
    href="./?a=b"
  />
</DocumentFragment>
`);
  });

  it("renders an anchor element with an absolute path", function() {
    let rendered = ReactTesting.render(<Link href="/path" />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <a
    href="/path"
  />
</DocumentFragment>
`);
  });

  it("renders an anchor element with a package spec", function() {
    let rendered = ReactTesting.render(<Link href="pkg:/path" />);
    expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <a
    href="/pkgpath/path"
  />
</DocumentFragment>
`);
  });

  it("throws if it cannot resolve URL from a package spec", function() {
    expect(() => ReactTesting.render(<Link href="pkgx:/path" />)).toThrow();
  });
});
