/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import { TimeField as Field } from "./TimeField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let value = ReactForms.useFormValueState({
      value: {
        message: "12:12:12"
      }
    });
    let valueWithRequired = ReactForms.useFormValueState({
      value: {
        message: "12:12:12"
      },
      schema: {
        type: "object",
        required: ["message", "message2"],
        properties: {
          message: { type: "string" },
          message2: { type: "string" }
        }
      }
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        message: "12:12:12"
      },
      schema: {
        type: "object",
        properties: {
          message: { type: "string", enum: ["Hello", "Hi"] }
        }
      }
    });
    return (
      <Fixture.Demo>
        <FormLayout>
          <Fixture.DemoItem label="regular">
            <Field formValue={value.select("message")} label="Greeting" />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />

          <Fixture.DemoItem label="read only">
            <Field
              readOnly={true}
              formValue={value.select("message")}
              label="Greeting"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="has hint">
            <Field
              formValue={value.select("message")}
              label="Greeting"
              hint="Enter some message here"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />

          <Fixture.DemoItem label="required">
            <Field
              forceShowErrors
              formValue={valueWithRequired.select("message")}
              label="Greeting"
              hint="Enter some message here"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="required and empty">
            <Field
              forceShowErrors
              formValue={valueWithRequired.select("message2")}
              label="Greeting"
              hint="Enter some message here"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={valueWithRequired} />

          <Fixture.DemoItem label="error">
            <Field
              forceShowErrors
              formValue={valueWithError.select("message")}
              label="Greeting"
              hint="Enter some message here"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={valueWithError} />
        </FormLayout>
      </Fixture.Demo>
    );
  }
});
