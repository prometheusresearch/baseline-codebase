/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import React from "react";
import * as mui from "@material-ui/core";
import { type DataSet } from "./data";

export type id = string | number;

export type Item = {
  id: id,
  title: string
};

type Props = {
  /**
   * This string or number was perhaps intended to select
   * the initial value for the drop-down but it has no effect.
   */
  value: id | null,

  /**
   * This function will be called when the user selects an item.
   * It is called with 2 arguments: id and value.
   * Both id and value will be set to the id of the item the user selected.
   */
  onChange: (?id) => void,

  /**
   * Empty value to appear first in the drop-down list.
   */
  emptyValue?: Item,

  error?: boolean,

  /**
   * Set to false, if you want an empty value in the drop-down list.
   */
  noEmptyValue?: boolean,

  /**
   * The title of the empty value.
   */
  titleForEmpty?: string,

  /**
   * This object must have a **data** property which contains
   * the list of items to appear in the drop-down after the options.
   * Each element in the list must have an id and a title.
   */
  data?: DataSet<Item[]>,

  /**
   * The list of items to appear in the drop-down before the data.
   * Each element in the list must have an id and a title.
   */
  options: Item[],

  /**
   * Render in "quiet" style.
   */
  quiet?: boolean
};

// we use this to mark empty value, otherwise DOM will use option's title as
// value
let sentinel = "";

/**
 * This component creates a drop-down list of items.
 *
 * Each item in the list is an object which must have the properties
 * **id** and **title**.
 * The id is a unique identifier for the item,
 * and the title is the text which appears in the drop-down for the item.
 *
 * To have the first item be an empty value, set **noEmptyValue** to false,
 * and set **emptyValue** to anything which is true.
 * You may provide the text to appear for the empty value
 * in **titleForEmpty** or you may set
 * **emptyValue** to an object with a **title** property.
 *
 * Any **options** appear next in the list followed by any items in **data**.
 */
export function Select(props: Props) {
  let {
    emptyValue = { id: sentinel, title: "" },
    titleForEmpty,
    noEmptyValue,
    quiet,
    value,
    onChange,
    options = [],
    data = null,
    error
  } = props;

  if (value === undefined || value === null) {
    value = emptyValue.id;
  }

  let onChangeDom = (e: Event) => {
    let element = ((e.target: any): HTMLSelectElement);
    let { id, value } = element;
    if (value === emptyValue.id) {
      value = null;
    }
    onChange(value);
  };

  React.useEffect(() => {
    if (value == null && noEmptyValue && options && options.length > 0) {
      onChange(options[0].id);
    }
  }, []);

  return (
    <mui.NativeSelect
      value={value}
      onChange={onChangeDom}
      input={<mui.Input />}
    >
      {!noEmptyValue && (
        <option key={sentinel} value={sentinel}>
          {titleForEmpty ? titleForEmpty : emptyValue.title}
        </option>
      )}
      {options.concat(data != null ? data.data || [] : []).map(o => (
        <option key={o.id} value={o.id}>
          {o.title}
        </option>
      ))}
    </mui.NativeSelect>
  );
}

export default Select;
