/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";

import { fetch, post, put, del } from "../fetch";

describe("rex-widget", function() {
  describe("fetch", function() {
    let origFetch = global.fetch;

    afterEach(function() {
      if (global.fetch !== origFetch) {
        global.fetch = origFetch;
      }
    });

    function mockFetch(response) {
      global.fetch = function fetchMock(url, options) {
        let promise = new Promise(function(resolve, reject) {
          resolve(response);
        });
        return promise;
      };
    }

    it("parses JSON", async function() {
      mockFetch({
        status: 200,
        json() {
          return "ok";
        }
      });
      let result = await fetch("/path");
      assert(result === "ok");
    });

    it("fails on non-200 response status codes", async function() {
      mockFetch({
        status: 400,
        statusText: "oops",
        json() {
          return "ok";
        }
      });
      try {
        await fetch("/path");
      } catch (err) {
        return;
      }
      assert(false);
    });

    it("POST data", async function() {
      mockFetch({
        status: 200,
        json() {
          return "ok";
        }
      });
      let result = await post("/path");
      assert(result === "ok");
    });

    it("POST data (json)", async function() {
      mockFetch({
        status: 200,
        json() {
          return "ok";
        }
      });
      let result = await post("/path", { a: 1 }, { jsonifyData: true });
      assert(result === "ok");
    });

    it("PUT data", async function() {
      mockFetch({
        status: 200,
        json() {
          return "ok";
        }
      });
      let result = await put("/path");
      assert(result === "ok");
    });

    it("DELETE data", async function() {
      mockFetch({
        status: 200,
        json() {
          return "ok";
        }
      });
      let response = await del("/path");
      let result = await response.json();
      assert(result === "ok");
    });
  });
});
