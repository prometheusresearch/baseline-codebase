/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";
import resolveURL, { mockMountPoints, unmockMountPoints } from "../resolveURL";

describe("resolveURL", function() {
  beforeEach(function() {
    mockMountPoints({
      pkg: "http://0.0.0.0/pkg"
    });
  });

  afterEach(function() {
    unmockMountPoints();
  });

  it("does not process absolute URLs", function() {
    assert(
      resolveURL("http://prometheusresearch.com") ===
        "http://prometheusresearch.com"
    );
    assert(
      resolveURL("https://prometheusresearch.com") ===
        "https://prometheusresearch.com"
    );
  });

  it("returns paths as is", function() {
    assert(resolveURL("/") === "/");
    assert(resolveURL("/path") === "/path");
  });

  it("resolves URL specs", function() {
    assert(resolveURL("pkg:/") === "http://0.0.0.0/pkg/");
    assert(resolveURL("pkg:/path") === "http://0.0.0.0/pkg/path");
  });

  it("fails if it cannot resolve URL spec", function() {
    assert.throws(function() {
      resolveURL("x:/path");
    }, "Invariant violation: Unable to resolve mount point for package x for URL /path");
  });
});
