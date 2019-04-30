/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import Autocomplete from "../Autocomplete";
import * as Field from "./Field";
import ReadOnlyField from "./ReadOnlyField";
import { useFetch, type Fetcher } from "../data";
import { useFormValue, type select, type value } from "react-forms";
import contextParams from "./contextParams";
import * as rexui from "rex-ui";

function isEmptyValue(value) {
  return value == null || Object.keys(value).length === 0;
}

function Value(props) {
  let { data, value, renderValue, titleAttribute = "title" } = props;
  let dataset = useFetch(
    value != null ? data.params({ "*": value }).getSingleEntity() : null
  );

  let item = dataset.data;

  if (renderValue != null) {
    let title = item != null ? item[titleAttribute] : null;
    return renderValue({ item, title });
  } else {
    return <div>{item != null ? item[titleAttribute] : null}</div>;
  }
}

type RenderValue = ({
  item: ?rexui.AutocompleteItem,
  title: ?string
}) => React.Node;

type Props = {|
  ...Field.Props,

  data: Fetcher<rexui.AutocompleteItem[]>,

  /**
   * The database field name which holds the value to be auto-completed.
   */
  valueAttribute: string,

  /**
   * The database field name which holds the title.
   */
  titleAttribute: string,

  /**
   * How many items to fetch from server for any given request.
   */
  limit: number,

  renderSuggestion?: rexui.AutocompleteRenderSuggestion,
  renderAutocompleteInput?: rexui.AutocompleteRenderInput,
  renderAutocompleteValue?: RenderValue
|};

/**
 * AutocompleteField component.
 *
 * @public
 */
function AutocompleteField({
  data,
  formValue: formValueOfProps,
  select,
  limit = 50,
  valueAttribute,
  titleAttribute,
  renderSuggestion,
  renderAutocompleteInput,
  renderAutocompleteValue,
  ...props
}: Props) {
  let formValue = useFormValue(formValueOfProps, select);
  let renderValueForField = value => {
    if (value == null) {
      return null;
    } else {
      return (
        <Value
          data={data}
          titleAttribute={titleAttribute}
          renderValue={renderAutocompleteValue}
          value={value}
        />
      );
    }
  };
  let titleDataSpec = data.params(contextParams(formValue.params.context));
  let queryDataSpec =
    data.path.indexOf("/@@/") > -1
      ? titleDataSpec.params({ query: true })
      : titleDataSpec;
  let renderInputForField = inputProps => (
    <Autocomplete
      {...inputProps}
      limit={limit}
      data={queryDataSpec}
      titleData={titleDataSpec}
      valueAttribute={valueAttribute}
      titleAttribute={titleAttribute}
      renderSuggestion={renderSuggestion}
      renderInput={renderAutocompleteInput}
    />
  );
  return (
    <Field.Field
      {...props}
      renderInput={renderInputForField}
      renderValue={renderValueForField}
      formValue={formValue}
    />
  );
}

export default AutocompleteField;
