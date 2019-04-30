/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import { SourceCodeField as Field } from "./SourceCodeField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let value = ReactForms.useFormValueState({
      value: {
        value: "just some text here"
      }
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        value: "just some text here"
      },
      schema: {
        type: "object",
        properties: {
          value: {
            format(value) {
              if (value.length < 40) {
                return "Should be at least 40 chars long";
              } else {
                return true;
              }
            }
          }
        }
      }
    });
    return (
      <Fixture.Demo>
        <FormLayout>
          <Fixture.DemoItem label="regular">
            <Field formValue={value.select("value")} label="Greeting" />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="regular, read only">
            <Field
              readOnly={true}
              formValue={value.select("value")}
              label="Greeting"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />
          <Fixture.DemoItem label="error">
            <Field
              forceShowErrors
              formValue={valueWithError.select("value")}
              label="Greeting"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={valueWithError} />
        </FormLayout>
      </Fixture.Demo>
    );
  }
});
