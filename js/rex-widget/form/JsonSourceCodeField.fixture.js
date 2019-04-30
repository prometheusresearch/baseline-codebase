/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import { JsonSourceCodeField as Field } from "./JsonSourceCodeField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let value = ReactForms.useFormValueState({
      value: {
        value: { some: "value" }
      }
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        value: { some: "value" }
      },
      schema: {
        type: "object",
        properties: {
          value: {
            format(value) {
              if (value.some != null) {
                return 'Should not contain "some" key';
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
          <Fixture.DemoItem label="read only">
            <Field
              readOnly={true}
              formValue={value.select("value")}
              label="Novel"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="has hint">
            <Field
              formValue={value.select("value")}
              label="Novel"
              hint="Some long text here..."
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />
          <Fixture.DemoItem label="error">
            <Field
              forceShowErrors
              formValue={valueWithError.select("value")}
              label="Novel"
              hint="Some long text here..."
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={valueWithError} />
        </FormLayout>
      </Fixture.Demo>
    );
  }
});
