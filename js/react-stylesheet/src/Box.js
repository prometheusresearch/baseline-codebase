/**
 * @flow
 */

import Element from "./Element";
import stylesheet from "./Stylesheet";

export let baseStyle = {
  position: "relative",

  overflow: "visible",

  margin: 0,
  padding: 0,

  display: "flex",
  alignItems: "stretch",
  flexBasis: "auto",
  flexShrink: 0,

  minHeight: 0,
  minWidth: 0
};

let boxStylesheet = stylesheet("Box", {
  base: baseStyle
});

boxStylesheet.inject();

class Box extends Element {
  static className = boxStylesheet.toClassName();
}

export class VBox extends Box {
  static defaultProps = {
    ...Box.defaultProps,
    flexDirection: "column"
  };
}

export class HBox extends Box {
  static defaultProps = {
    ...Box.defaultProps,
    flexDirection: "row"
  };
}
