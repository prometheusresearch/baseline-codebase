/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import { VBox } from "react-stylesheet";
import { type error } from "react-forms";
import * as rexui from "rex-ui";

type Props = {
  errorList: error[]
};

export function ErrorList({ errorList }: Props) {
  let theme = rexui.useTheme();
  return (
    <VBox marginTop={0} color={theme.palette.error.main} fontSize="0.75rem">
      {errorList.map((error, idx) => (
        <VBox key={idx}>Error: {error.message}</VBox>
      ))}
    </VBox>
  );
}
