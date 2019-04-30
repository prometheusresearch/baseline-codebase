/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import { IntegerField as Field } from "./IntegerField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let value = ReactForms.useFormValueState({
      value: {
        num: 42
      },
      schema: {
        type: "object",
        properties: {
          num: {
            type: "number"
          }
        }
      }
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        num: 42
      },
      schema: {
        type: "object",
        properties: {
          num: {
            format(value) {
              if (value <= 42) {
                return "Should be more than 42";
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
            <Field formValue={value.select("num")} label="Greeting" />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="regular, read only">
            <Field
              readOnly={true}
              formValue={value.select("num")}
              label="Greeting"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />
          <Fixture.DemoItem label="error">
            <Field
              forceShowErrors
              formValue={valueWithError.select("num")}
              label="Greeting"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={valueWithError} />
        </FormLayout>
      </Fixture.Demo>
    );
  }
});
