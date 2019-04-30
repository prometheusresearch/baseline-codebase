/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import { CheckboxField as Field } from "./CheckboxField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let value = ReactForms.useFormValueState({
      value: {
        enabled: true
      }
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        enabled: false
      },
      schema: {
        type: "object",
        properties: {
          enabled: { type: "string", enum: ["Hello", "Hi"] }
        }
      }
    });
    return (
      <Fixture.Demo>
        <FormLayout>
          <Fixture.DemoItem label="regular">
            <Field formValue={value.select("enabled")} label="Is enabled" />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="regular, read only">
            <Field
              readOnly={true}
              formValue={value.select("enabled")}
              label="Is enabled"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />
          <Fixture.DemoItem label="error">
            <Field
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
