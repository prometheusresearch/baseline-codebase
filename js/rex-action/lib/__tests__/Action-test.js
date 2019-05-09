/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactTesting from "react-testing-library";

import * as ui from "rex-widget/ui";
import Action from "../Action";

afterEach(ReactTesting.cleanup);

test("renders", function() {
  ReactTesting.render(<Action />);
});
