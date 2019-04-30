/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import { DateField as Field } from "./DateField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let value = ReactForms.useFormValueState({
      value: {
        message: "2012-12-12"
      }
    });
    let valueWithRequired = ReactForms.useFormValueState({
      value: {
        message: "2012-12-12"
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
        message: "2012-12-12"
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
          <Fixture.DemoItem label="has different input format">
            <Field
              inputFormat="M/D/YYYY"
              formValue={value.select("message")} label="Greeting" />
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
          <Fixture.DemoItem label="has minDate">
            <Field
              formValue={value.select("message")}
              label="When"
              minDate="2012-12-08"
              hint="Not before 2012-12-08"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="has maxDate">
            <Field
              formValue={value.select("message")}
              label="When"
              maxDate="2012-12-15"
              hint="Not after 2012-12-15"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="has minDate and maxDate">
            <Field
              formValue={value.select("message")}
              label="When"
              minDate="2012-12-07"
              maxDate="2012-12-15"
              hint="Between 2012-12-07 and 2012-12-15"
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
