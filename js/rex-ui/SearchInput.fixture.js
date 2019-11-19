// @flow

import * as Fixture from "./Fixture";
import * as React from "react";
import { SearchInput } from "./SearchInput";

let onChange = value => console.log("onChange", value);

export default Fixture.fixture({
  component: SearchInput,
  render(C, props) {
    return (
      <Fixture.Demo>
        <Fixture.DemoItem label="regular">
          <C value={null} onChange={onChange} />
        </Fixture.DemoItem>
        <Fixture.DemoItem label="has value">
          <C value="Bananas" onChange={onChange} />
        </Fixture.DemoItem>
        <Fixture.DemoItem label="Custom placeholder">
          <C
            value={null}
            placeholder="Search for bananas"
            onChange={onChange}
          />
        </Fixture.DemoItem>
      </Fixture.Demo>
    );
  },
});
