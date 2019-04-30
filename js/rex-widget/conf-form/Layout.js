/**
 * @copyright 2015, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { useFormValue, type value, type select } from "react-forms";
import { VBox } from "react-stylesheet";
import { renderFieldConfig } from "./ConfField";
import { type Config } from "./types";

type Props = {
  /**
   * An array of field specifications to render.
   */
  fields: Config[],

  /**
   * Form value.
   */
  formValue?: value,
  select?: select,

  /**
   * A bag of props which should be passed to fields.
   */
  fieldProps?: Object,

  layoutProps?: Object
};

function _impl(direction, props) {
  let {
    fields,
    formValue: formValueOfProps,
    select,
    fieldProps,
    layoutProps
  } = props;
  let formValue = useFormValue(formValueOfProps, select);
  let items = fields.map((field, idx) =>
    renderFieldConfig(formValue, field, fieldProps, idx)
  );
  return (
    <VBox {...layoutProps} direction={direction}>
      {items}
    </VBox>
  );
}

export function ConfColumn(props: Props) {
  return _impl("column", props);
}

export function ConfRow(props: Props) {
  return _impl("row", props);
}
