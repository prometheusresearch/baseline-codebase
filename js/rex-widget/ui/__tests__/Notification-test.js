/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactTesting from "react-testing-library";
import Notification from "../Notification";

afterEach(ReactTesting.cleanup);

describe("<Notification />", function() {
  it("renders", function() {
    let rendered = ReactTesting.render(<Notification />);
  });
});
