/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactTesting from "react-testing-library";
import * as History from "rex-ui/History";
import * as TestHarness from "rex-ui/TestHarness";
import DynamicPageContent from "../DynamicPageContent";
import * as ui from "../ui";
import * as lang from "../lang";

function stubFetch(): { resolve: any => void, reject: Error => void } {
  let handle = { resolve: undefined, reject: undefined };
  let promise = {
    then(_onSuccess, _onError) {
      handle.resolve = _onSuccess;
      handle.reject = _onError;
      return promise;
    }
  };
  global.fetch = jest.fn().mockReturnValue(promise);
  return (handle: any);
}

describe("rex-widget", function() {
  describe("<DynamicPageContent />", function() {
    TestHarness.silenceConsoleError();

    let fetch = global.fetch;
    beforeEach(function() {
      fetch = global.fetch;
    });
    afterEach(function() {
      global.fetch = fetch;
    });

    afterEach(ReactTesting.cleanup);

    it("renders", async function() {
      let onNavigation = jest.fn();
      let rendered = ReactTesting.render(
        <DynamicPageContent
          content="HELLO"
          preloader="PRELOADER"
          location={History.createLocation("/")}
          onNavigation={onNavigation}
        />
      );
      expect(rendered.asFragment()).toMatchSnapshot();
    });

    it("re-fetches content on new location", async function() {
      let fetch = stubFetch();

      let onNavigation = jest.fn();
      let rendered = ReactTesting.render(
        <DynamicPageContent
          content="HELLO"
          preloader="PRELOADER"
          location={History.createLocation("/")}
          onNavigation={onNavigation}
        />
      );
      expect(rendered.asFragment()).toMatchSnapshot();

      rendered.rerender(
        <DynamicPageContent
          content="HELLO"
          preloader="PRELOADER"
          location={History.createLocation("/next")}
          onNavigation={onNavigation}
        />
      );
      expect(rendered.asFragment()).toMatchSnapshot();

      fetch.resolve({ props: { content: "NEXT HELLO" } });

      await lang.delay(20);

      expect(rendered.asFragment()).toMatchSnapshot();
    });

    it("re-fetches content on new location (error)", async function() {
      let fetch = stubFetch();

      let onNavigation = jest.fn();
      let rendered = ReactTesting.render(
        <DynamicPageContent
          content="HELLO"
          preloader="PRELOADER"
          location={History.createLocation("/")}
          onNavigation={onNavigation}
        />
      );
      expect(rendered.asFragment()).toMatchSnapshot();

      rendered.rerender(
        <DynamicPageContent
          content="HELLO"
          preloader="PRELOADER"
          location={History.createLocation("/next")}
          onNavigation={onNavigation}
        />
      );
      expect(rendered.asFragment()).toMatchSnapshot();

      fetch.reject(new Error("oops"));

      await lang.delay(20);

      expect(rendered.asFragment()).toMatchSnapshot();
    });
  });
});
