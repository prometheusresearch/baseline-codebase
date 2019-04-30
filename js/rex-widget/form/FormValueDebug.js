/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as ReactForms from "react-forms";

export let FormValueDebug = ({
  formValue: formValueOfProps,
  select
}: {|
  formValue?: ReactForms.value,
  select?: ReactForms.select
|}) => {
  let formValue = ReactForms.useFormValue(formValueOfProps, select);
  return (
    <div
      style={{
        padding: 20,
        color: "#222",
        backgroundColor: "#EEE",
        borderBottom: "1px solid #888888",
        fontFamily: "Menlo, Monaco, monospace",
        fontSize: "10pt"
      }}
    >
      <pre>{JSON.stringify(formValue.value, null, 2)}</pre>
    </div>
  );
};
