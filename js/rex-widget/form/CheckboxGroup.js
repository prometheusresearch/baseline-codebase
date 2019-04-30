/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { VBox, HBox } from "react-stylesheet";
import invariant from "../invariant";
import Checkbox from "./Checkbox";

export type Id = string;
export type Entity = { id: Id };
export opaque type Value = Id | Entity;

export type Option = {
  id: Id,
  title: string
};

export type ValueStrategy<Value> = {
  findIndex(value: ?(Value[]), option: Option): number,
  optionToValue(option: Option): Value,
  isChecked(value: ?(Value[]), option: Option): boolean,
  update(value: ?(Value[]), option: Option, checked: boolean): Value[]
};

function makeValueStrategy<T>(spec: {
  findIndex(value: ?(T[]), option: Option): number,
  optionToValue(option: Option): T
}): ValueStrategy<T> {
  return {
    findIndex(value, option) {
      return spec.findIndex(value, option);
    },

    optionToValue(option: Option): T {
      return spec.optionToValue(option);
    },

    isChecked(value, option) {
      return this.findIndex(value, option) > -1;
    },

    update(value, option, checked) {
      value = value || [];
      value = value.slice(0);
      let idx = this.findIndex(value, option);
      if (checked) {
        invariant(idx === -1, "Duplicate id added");
        value.push(this.optionToValue(option));
      } else {
        invariant(idx > -1, "Non-existent id unchecked");
        value.splice(idx, 1);
      }
      return value;
    }
  };
}

export let primitiveValueStrategy: ValueStrategy<Id> = makeValueStrategy({
  findIndex(value, option) {
    if (!value) {
      return -1;
    }
    return value.indexOf(option.id);
  },

  optionToValue(option: Option) {
    return option.id;
  }
});

export let entityValueStrategy: ValueStrategy<Entity> = makeValueStrategy({
  findIndex(value, option) {
    if (!value) {
      return -1;
    } else {
      return value.findIndex(item => item.id === option.id);
    }
  },

  optionToValue(option: Option) {
    return { id: option.id };
  }
});

type Props<T> = {
  options: Option[],
  value: T[],
  onChange: (T[]) => void,
  valueStrategy: ValueStrategy<T>
};

function CheckboxGroup<T>({
  options,
  value,
  onChange,
  valueStrategy = (primitiveValueStrategy: ValueStrategy<any>)
}: Props<T>) {
  let renderOption = option => {
    let handleOnChange = checked => {
      value = valueStrategy.update(value, option, checked);
      onChange(value);
    };

    let checked = valueStrategy.isChecked(value, option);

    return (
      <mui.FormControlLabel
        key={option.id}
        label={option.title}
        control={<Checkbox value={checked} onChange={handleOnChange} />}
      />
    );
  };

  return <mui.FormGroup>{options.map(renderOption)}</mui.FormGroup>;
}

export default CheckboxGroup;
