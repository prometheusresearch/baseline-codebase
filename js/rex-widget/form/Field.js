/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as mui from "@material-ui/core";
import { useFormValue, type select, type value } from "react-forms";
import { coerceMaybeEventToValue } from "react-forms/DOMUtil";

import { ViewValue, type RenderValue } from "./ViewValue";
import { Input } from "./Input";
import { ErrorList } from "./ErrorList";

/**
 * These props are passed to a field's input component.
 */
export type InputProps = {|
  error: boolean,
  value: any,
  onChange: any => void
|};

/**
 * These props are passed to a field's label component.
 */
export type LabelProps = {|
  error: boolean,
  required: boolean,
  value: any,
  label: ?string
|};

export type RenderLabel = LabelProps => React.Node;

export type RenderInput = InputProps => React.Node;

export type Props = {|
  /**
   * The field's label.
   */
  label?: ?string,

  /**
   * The additional text which further elaborates on field's purpose.
   */
  hint?: ?string,

  /**
   * Render input component.
   *
   * Renders default text input if not provided.
   */
  renderInput?: RenderInput,

  /**
   * Render label component.
   */
  renderLabel?: RenderLabel,

  /**
   * Render value component.
   */
  renderValue?: RenderValue,

  /**
   * The input element to use.
   *
   * This prop is deprecated, use `renderInput` instead.
   */
  children?: any,

  /**
   * The callback which fires when the field is changed.
   */
  onChange?: Function,

  /**
   * Derialize the field value.
   */
  serialize?: Function,

  /**
   * Deserialize the field value.
   */
  deserialize?: Function,

  /**
   * Current form value to use.
   */
  formValue?: value,

  /**
   * Select form value by this keypath from value presented in context.
   */
  select?: select,

  /**
   * Should the field render read only value instead of providing an input.
   */
  readOnly?: boolean,

  layout?: "horizontal" | "vertical",

  /**
   * Force field to show errors if any.
   *
   * By default it hides the errors unless requested.
   */
  forceShowErrors?: boolean,

  /**
   * Allow to use label as placeholder when form value is empty.
   */
  useLabelAsPlaceholder?: boolean
|};

/**
 * Field component.
 *
 * Base field component with <label>, <input>, hints, and error messages.
 *
 * @public
 */
export function Field(props: Props) {
  let {
    serialize = (value: any) => value,
    deserialize = (value: any) => value,
    label,
    hint,
    renderInput,
    renderLabel,
    renderValue,
    children,
    formValue: formValueOfProps,
    select,
    onChange: onChangeOfProps,
    readOnly,
    layout,
    forceShowErrors,
    useLabelAsPlaceholder,
    ...rest
  } = props;

  let [dirty, setDirty] = React.useState(false);
  let formValue = useFormValue(formValueOfProps, select);

  if (readOnly) {
    // backward compat, some fields pass contents as children
    if (renderValue == null) {
      if (children != null) {
        renderValue = _value => children;
      } else {
        renderValue = value => value == null ? null : String(value);
      }
    }

    return (
      <ViewValue
        formValue={formValue}
        layout={layout}
        label={label}
        hint={hint}
        renderValue={renderValue}
      />
    );
  }

  let { value, errorList, params, schema } = formValue;
  let showErrors = dirty || params.forceShowErrors || forceShowErrors;
  let isError = Boolean(showErrors && errorList.length > 0);

  let onBlur = () => {
    if (!dirty) {
      setDirty(true);
    }
  };

  let onChange = (e: Event) => {
    let value = coerceMaybeEventToValue(e);
    value = deserialize(value);
    if (onChangeOfProps) {
      onChangeOfProps(value);
    }
    formValue.update(value);
    setDirty(true);
  };

  let isRequired = Boolean(schema && schema.isRequired);
  let serializedValue = serialize(value);

  let inputElement = null;
  let inputProps = {
    error: isError,
    value: serializedValue,
    onChange
  };

  if (renderInput != null) {
    inputElement = renderInput(inputProps);
  } else if (children != null) {
    // this behaviour is deprecated
    inputElement = React.cloneElement(
      React.Children.only(children),
      inputProps
    );
  } else {
    inputElement = <Input {...inputProps} />;
  }

  let labelElement = null;
  if (renderLabel != null) {
    labelElement = renderLabel({
      label,
      value: serializedValue,
      error: isError,
      required: isRequired
    });
  } else {
    if (label != null) {
      labelElement = (
        <mui.InputLabel
          shrink={useLabelAsPlaceholder ? undefined : true}
          variant="standard"
          required={isRequired}
        >
          {label}
        </mui.InputLabel>
      );
    }
  }

  let hintElement = null;
  if (hint != null) {
    hintElement = (
      <mui.FormHelperText variant="standard">{hint}</mui.FormHelperText>
    );
  }

  // Always render error element which works as field separator when empty and
  // prevents "jumpiness" when transitioning between no-error and error states.
  let errorElement = (
    <div style={{ margin: "6px 0 7px", minHeight: "1rem" }}>
      {isError ? <ErrorList errorList={errorList} /> : null}
    </div>
  );

  return (
    <div onBlur={onBlur}>
      <mui.FormControl
        style={{margin: 0}}
        fullWidth={true}
        variant="outlined"
        error={isError}
        required={isRequired}
      >
        {labelElement}
        {inputElement}
        {hintElement}
        {errorElement}
      </mui.FormControl>
    </div>
  );
}

export default Field;
