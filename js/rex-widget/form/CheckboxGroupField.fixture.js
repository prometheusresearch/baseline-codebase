/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import * as Data from "../data";
import { CheckboxGroupField as Field } from "./CheckboxGroupField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let value = ReactForms.useFormValueState({
      value: {
        enabled: ["one", "two"]
      }
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        enabled: ["one", "two"]
      },
      schema: {
        type: "object",
        properties: {
          enabled: {
            format(value, node) {
              value = value || [];
              if (value.indexOf("three") === -1) {
                return 'choose "Three" value';
              } else {
                return true;
              }
            }
          }
        }
      }
    });
    let options = React.useMemo(() =>
      Data.data([
        { id: "one", title: "One" },
        { id: "two", title: "Two" },
        { id: "three", title: "Three" },
        { id: "four", title: "Four" }
      ])
    );
    return (
      <Fixture.Demo>
        <FormLayout>
          <Fixture.DemoItem label="regular">
            <Field
              plain
              options={options}
              formValue={value.select("enabled")}
              label="Is enabled"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="regular, read only">
            <Field
              plain
              options={options}
              readOnly={true}
              formValue={value.select("enabled")}
              label="Is enabled"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />
          <Fixture.DemoItem label="error">
            <Field
              plain
              options={options}
              forceShowErrors
              formValue={valueWithError.select("enabled")}
              label="Is enabled"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={valueWithError} />
        </FormLayout>
      </Fixture.Demo>
    );
  }
});
