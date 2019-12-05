// @flow

import * as React from "react";
import * as Fixture from "./Fixture";
import { Button } from "./Button";

export default Fixture.fixture({
  component: Button,
  render: Fixture.renderButtonFixture,
  props: { children: "Click me" },
});
