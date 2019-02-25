import * as React from "react";
import * as RexForms from "rex-forms";

function Input(props) {
  const value = props.value || "";
  const onChange = e => {
    props.onChange(e.target.value);
  };
  return (
    <input
      type="text"
      style={{ fontSize: "24pt", padding: 10, fontWeight: "bold" }}
      value={value}
      onChange={onChange}
    />
  );
}

export default function BigTextInput(props) {
  return (
    <RexForms.Widget {...props}>
      <Input />
    </RexForms.Widget>
  );
}
