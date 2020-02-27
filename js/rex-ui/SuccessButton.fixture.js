// @flow

import * as Fixture from "./Fixture";
import { SuccessButton } from "./SuccessButton";

export default Fixture.fixture({
  component: SuccessButton,
  render: Fixture.renderButtonFixture,
  props: { children: "Success" },
});
