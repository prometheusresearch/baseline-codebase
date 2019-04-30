/**
 * @flow
 */

import * as React from "react";
import { HBox, VBox } from "react-stylesheet";
// $FlowFixMe: ...
import { SwatchColorPicker } from "@prometheusresearch/react-ui";
import * as ui from "../ui";
import SelectAttribute from "./SelectAttribute";
import { COLOR_LIST } from "./ColorList";

type SelectAttributeWithColorProps = {
  options: $ReadOnlyArray<ui.SelectOption>,
  label: string,
  noValueLabel?: string,
  value: ?string,
  color: ?string,
  onChange: (?string, ?ui.SelectOption) => *,
  onColorChange: string => *
};

export default function SelectAttributeWithColor({
  label,
  noValueLabel,
  value,
  color,
  onChange,
  onColorChange,
  ...props
}: SelectAttributeWithColorProps) {
  return (
    <HBox flexGrow={1} alignItems="center" overflow="visible">
      <SelectAttribute
        {...props}
        label={value == null ? noValueLabel || label : label}
        value={value}
        onChange={onChange}
      />
      {value != null && (
        <SwatchColorPicker
          value={color}
          onChange={onColorChange}
          colorList={COLOR_LIST}
          menuPosition="right"
        />
      )}
    </HBox>
  );
}
