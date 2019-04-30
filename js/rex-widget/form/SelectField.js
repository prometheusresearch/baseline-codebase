/**
 * @copyright 2016, Prometheus Research, LLC
 * @flow
 */

import * as rexui from "rex-ui";
import * as React from "react";
import { useFormValue, type select, type value } from "react-forms";
import { Select, type Item } from "../Select";
import { useFetch, type Fetcher } from "../data";
import * as Field from "./Field";
import { ViewValue } from "./ViewValue";
import ReadOnlyField from "./ReadOnlyField";

type Props = {|
  ...Field.Props,

  /**
   * Set to false, if you want an empty value in the drop-down list.
   */
  noEmptyValue?: boolean,

  /**
   * The list of items to appear in the drop-down before the data.
   * Each element in the list must have an id and a title.
   */
  options?: Item[],

  /**
   * Data from which to fetch options.
   */
  data?: Fetcher<Item[]>
|};

/**
 * Renders a <Field> with a <Select>.
 *
 * @public
 */
export function SelectField(props: Props) {
  let {
    noEmptyValue,
    options,
    data,
    select,
    formValue: formValueOfProps,
    ...fieldProps
  } = props;
  let formValue = useFormValue(formValueOfProps, select);
  let dataset = useFetch(data);

  let renderValue = value => {
    if (value) {
      if (options) {
        return findByValue(options, value) || null;
      } else if (dataset.updating) {
        return <rexui.PreloaderScreen />;
      } else {
        return findByValue(dataset.data, value) || null;
      }
    }
    return null;
  };

  let renderInput = props => (
    <Select
      {...props}
      options={(options || []).map(v => ({
        id: (v: any).value || v.id,
        title: (v: any).label || v.title
      }))}
      noEmptyValue={noEmptyValue}
      data={dataset}
    />
  );

  return (
    <Field.Field
      {...fieldProps}
      formValue={formValue}
      renderValue={renderValue}
      renderInput={renderInput}
    />
  );
}

function getTitle(item: any) {
  return item.title || item.label;
}

function findByValue(options: ?(Item[]), value) {
  if (!options) {
    return null;
  }
  for (let i = 0; i < options.length; i++) {
    if ((options[i]: any).value == value) {
      return getTitle(options[i]);
    }
    if ((options[i]: any).id == value) {
      return getTitle(options[i]);
    }
  }
}
