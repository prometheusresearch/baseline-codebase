/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as DOMUtil from "./DOMUtil.js";
import {useFormValue} from "./Component";
import Input from "./Input";
import Label from "./Label";
import ErrorList from "./ErrorList";
import * as types from "./types";

type InputProps = {
  value: mixed,
  onChange: mixed => void,
};

type Props = {
  label?: string,
  select?: types.select,
  formValue?: types.value,
  renderInput: InputProps => React.Node,
};

function Field(props: Props) {
  let [dirty, setDirty] = React.useState(false);

  let onBlur = () => {
    this.setState({dirty: true});
  };

  let onChange = e => {
    let value = DOMUtil.coerceMaybeEventToValue(e);
    formValue.update(value);
    setDirty(true);
  };

  let {renderInput, label, select, formValue: formValueOfProps} = props;

  let formValue = useFormValue(formValueOfProps, select);
  let {schema, value, params = {}} = formValue;
  let showErrors = dirty || params.forceShowErrors;

  let inputElement = null;
  if (renderInput != null) {
    inputElement = renderInput({value, onChange});
  } else {
    // $FlowFixMe: check if it's a string?
    let valueAsString: string = value;
    inputElement = <Input value={valueAsString} onChange={onChange} />;
  }

  return (
    <div onBlur={onBlur}>
      <Label label={label} schema={schema} />
      <div>{inputElement}</div>
      <ErrorList hideNonForced={!showErrors} formValue={formValue} />
    </div>
  );
}

export default Field;
