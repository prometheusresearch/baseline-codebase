// @flow

import * as React from "react";
import * as ReactTesting from "react-testing-library";
import withFormValue from "./withFormValue";
import { Context } from "./Component";
import * as Value from "./Value";

afterEach(ReactTesting.cleanup);

test("allows access to a form value", () => {
  let formValue: Value.Value;

  let Component = withFormValue(function Component(props) {
    formValue = props.formValue;
    return null;
  });

  let initFormValue = Value.create();

  ReactTesting.render(
    <Context.Provider value={initFormValue}>
      <Component />
    </Context.Provider>
  );

  let v: Value.Value = formValue;
  expect(v).toBeTruthy();
  expect(v.keyPath).toEqual([]);
});

test("allows access to a form value and selecting inside it", () => {
  let formValue: Value.Value;

  let Component = withFormValue(function Component(props) {
    formValue = props.formValue;
    return null;
  });

  let initFormValue = Value.create();

  ReactTesting.render(
    <Context.Provider value={initFormValue}>
      <Component select="a.b" />
    </Context.Provider>
  );

  let v: Value.Value = formValue;
  expect(v).toBeTruthy();
  expect(v.keyPath).toEqual(["a", "b"]);
});

test("allows access to a form value and selecting inside it (array notation)", () => {
  let formValue: Value.Value;

  let Component = withFormValue(function Component(props: {
    formValue: Value.Value
  }) {
    formValue = props.formValue;
    return null;
  });

  let initFormValue = Value.create();

  ReactTesting.render(
    <Context.Provider value={initFormValue}>
      <Component select={["a", "b"]} />
    </Context.Provider>
  );

  let v: Value.Value = formValue;
  expect(v).toBeTruthy();
  expect(v.keyPath).toEqual(["a", "b"]);
});
