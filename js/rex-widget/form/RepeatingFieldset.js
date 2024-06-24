/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import * as rexui from "rex-ui";
import { HBox, VBox, Element } from "react-stylesheet";
import {
  useFormValue,
  Fieldset as FieldsetBase,
  type value,
  type select,
} from "react-forms";

import { Fieldset } from "./Fieldset";
import { ErrorList } from "./ErrorList";
import { type layout } from "./Layout";

type Props = {|
  /**
   * The data to display.
   */
  formValue?: value,

  select?: select,

  /**
   * The label.
   */
  label?: string,

  /**
   * The hint.
   */
  hint?: string,

  /**
   * The read-only flag.
   */
  readOnly?: boolean,

  /**
   * The text of the Add Button.
   */
  addButtonText?: string,

  /**
   * The text of the Remove Button.
   */
  removeButtonText?: string,

  /**
   * Children
   */
  children?: React.Node,

  /**
   * Default value for a new item.
   */
  defaultValue?: any,

  forceShowErrors?: boolean,

  layout?: layout,
|};

/**
 * RepeatingFieldset component.
 *
 * This component renders a fieldset multiple times for each item in an array.
 *
 * @public
 */
export function RepeatingFieldset({
  children,
  formValue: formValueOfProps,
  select,
  label,
  hint,
  readOnly,
  addButtonText = "Add",
  removeButtonText = "Remove",
  forceShowErrors = false,
  defaultValue,
  ...props
}: Props) {
  let theme = rexui.useTheme();
  let formValue = useFormValue(formValueOfProps, select);
  let value: Array<any> = formValue.value == null ? [] : (formValue.value: any);

  let schema = formValue.schema;
  let required = schema != null && schema.isRequired;

  let addItem = () => {
    let nextValue = value.slice(0);
    if (defaultValue === undefined) {
      if (schema != null) {
        defaultValue = schema.defaultItem || {};
      } else {
        defaultValue = {};
      }
    }
    nextValue.push(defaultValue);
    formValue.update(nextValue);
  };

  let removeItem = idx => {
    let nextValue = value.slice(0);
    nextValue.splice(idx, 1);
    formValue.update(nextValue);
  };

  // TODO: validate that we have an array here
  let fieldsets = value.map((item, idx) => {
    const toolbar = (
      <Element paddingBottom={theme.spacing()}>
        <rexui.DangerButton
          size="small"
          icon={<icons.Close />}
          onClick={() => removeItem(idx)}
        >
          {removeButtonText}
        </rexui.DangerButton>
      </Element>
    );
    const content = (
      <VBox>
        {!readOnly ? toolbar : null} {children}
      </VBox>
    );
    return (
      <Element padding={theme.spacing(0.25)} key={idx}>
        <mui.Paper>
          <Element padding={theme.spacing()}>
            <Fieldset formValue={formValue.select(idx)}>
              <VBox paddingBottom={theme.spacing()}>{content}</VBox>
            </Fieldset>
          </Element>
        </mui.Paper>
      </Element>
    );
  });

  const verticalFieldSpacing = theme.spacing();
  const horizontalFieldSpacing = theme.spacing(2);

  let isRequired = schema != null && schema.isRequired;
  let showErrors = formValue.params.forceShowErrors || forceShowErrors;
  let isError = Boolean(showErrors && formValue.errorList.length > 0);

  let labelElement = null;
  if (label != null) {
    labelElement = (
      <mui.FormLabel
        error={isError}
        required={isRequired}
        style={{ paddingBottom: theme.spacing() }}
      >
        {label}
      </mui.FormLabel>
    );
  }

  let hintElement = null;
  if (hint != null) {
    hintElement = (
      <mui.FormHelperText error={isError} variant="standard">
        {hint}
      </mui.FormHelperText>
    );
  }

  // If we don't render errors then render hints instead for common errors such
  // as minItems, maxItems and isRequired.
  let preventiveErrorHint = null;
  if (!readOnly && !isError) {
    preventiveErrorHint = renderPreventiveErrorHint(schema, value);
  }

  return (
    <VBox marginBottom={verticalFieldSpacing} marginTop={verticalFieldSpacing}>
      {labelElement}
      <FieldsetBase formValue={formValue}>{fieldsets}</FieldsetBase>
      {hintElement}
      {isError && <ErrorList errorList={formValue.errorList} />}
      {!isError && preventiveErrorHint}
      {!readOnly && (
        <Element padding={theme.spacing()}>
          <rexui.Button icon={<icons.Add />} size="small" onClick={addItem}>
            {addButtonText} {label}
          </rexui.Button>
        </Element>
      )}
    </VBox>
  );
}

function renderPreventiveErrorHint(schema, value) {
  if (schema == null) {
    return null;
  }

  let { minItems, maxItems, isRequired } = schema;
  if (minItems == null && isRequired) {
    minItems = 1;
  }

  let name = n => (n == 1 ? "item" : "items");

  let hint = null;
  if (minItems != null && maxItems != null) {
    hint = `Between ${minItems} and ${maxItems} ${name(
      maxItems,
    )} should be specified`;
  } else if (minItems != null) {
    hint = `Should have at least ${minItems} ${name(minItems)} specified`;
  } else if (maxItems != null) {
    hint = `Should have no more than ${maxItems} ${name(maxItems)} specified`;
  }

  if (hint == null) {
    return null;
  } else {
    return <mui.FormHelperText variant="standard">{hint}</mui.FormHelperText>;
  }
}
