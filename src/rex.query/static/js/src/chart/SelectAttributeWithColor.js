/**
 * @flow
 */

import * as React from 'react';
import {HBox} from 'react-stylesheet';
import {SwatchColorPicker} from '@prometheusresearch/react-ui';
import {type Context} from '../model';
import SelectAttribute from './SelectAttribute';
import {COLOR_LIST} from './ColorList';

type SelectAttributeWithColorProps = {
  context: Context,
  label: string,
  noValueLabel?: string,
  value: ?string,
  color: ?string,
  onChange: (?string) => *,
  onColorChange: (string) => *,
};

export default function SelectAttributeWithColor(
  {
    context,
    label,
    noValueLabel,
    value,
    color,
    onChange,
    onColorChange,
    ...props
  }: SelectAttributeWithColorProps,
) {
  return (
    <HBox flexGrow={1} alignItems="center" overflow="visible">
      <SelectAttribute
        {...props}
        label={value == null ? noValueLabel || label : label}
        value={value}
        context={context}
        onChange={onChange}
      />
      {value != null &&
        <SwatchColorPicker
          value={color}
          onChange={onColorChange}
          colorList={COLOR_LIST}
          menuPosition="right"
        />}
    </HBox>
  );
}
