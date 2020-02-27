// @flow

import * as Fixture from "./Fixture";
import { DangerButton } from "./DangerButton";

export default Fixture.fixture({
  component: DangerButton,
  render: Fixture.renderButtonFixture,
  props: { children: "Critical" },
});
