import * as React from "react";

import { storiesOf } from "@storybook/react";
import { action } from '@storybook/addon-actions';

import { Info } from "./Info";

import { StoryButton } from "./StoryButton";

storiesOf("Button", module).add("With example value", Info(() => (
  <StoryButton 
    value={"Hello there!"}
    onClick={action('StoryButton onClick')}
  />
)));