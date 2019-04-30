/**
 * @flow
 */

import * as React from "react";
import { VBox, HBox, Element } from "react-stylesheet";

type ChartControlProps = {
  label: string,
  control?: React.Node,
  hint?: string
};

export default function ChartControl({
  label,
  hint,
  control
}: ChartControlProps) {
  return (
    <HBox overflow="visible" alignItems="center" padding={5}>
      <VBox
        width={200}
        padding={10}
        fontWeight={200}
        alignItems="flex-end"
        userSelect="none"
        cursor="default"
      >
        <Element Component="label" fontSize="10pt">
          {label}
        </Element>
        {hint && (
          <Element fontSize="8pt" opacity={0.6}>
            {hint}
          </Element>
        )}
      </VBox>
      <HBox overflow="visible" flexGrow={1}>
        {control}
      </HBox>
    </HBox>
  );
}
