/**
 * @flow
 */

import * as React from "react";
import { Element } from "react-stylesheet";

export default function NoNumericAttributeText() {
  return (
    <Element fontSize="8pt" fontWeight={200}>
      No numeric attributes found. Probably you want to link a new subquery with
      a numeric value?
    </Element>
  );
}
