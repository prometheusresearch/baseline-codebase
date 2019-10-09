import * as React from "react";
import { style } from "react-stylesheet";

export const RexUIPickerWrapper = style(
  props => {
    return <div {...props} />;
  },
  {
    base: {
      // 320 + (16 + 16) (paddings)
      width: 352,
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)"
    }
  }
);

export const InputWrapper = style(
  props => {
    return <div {...props} />;
  },
  {
    base: {
      // So far it's the height value from ReactUI.Input
      paddingRight: 34,
      position: "relative",
      marginBottom: 16
    }
  }
);

export const Toggler = style(
  props => {
    return <div {...props} />;
  },
  {
    base: {
      // So far it's the height value from ReactUI.Input
      width: 34,
      height: 34,
      position: "absolute",
      cursor: "pointer"
    }
  }
);
