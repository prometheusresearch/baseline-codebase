/**
 * @flow
 */

import * as React from "react";
import { configure, addDecorator } from "@storybook/react";

function load() {
  require("./stories/index.tsx");
}

configure(load, module);
