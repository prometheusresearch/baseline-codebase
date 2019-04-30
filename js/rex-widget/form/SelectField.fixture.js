/**
 * @copyright 2019-present, Prometheus Research, LLC
 * @flow
 */

import * as Fixture from "rex-ui/Fixture";
import * as React from "react";
import * as ReactForms from "react-forms";
import * as Data from "../data";
import { SelectField as Field } from "./SelectField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Field,
  render(Field, props) {
    let data = React.useMemo(() =>
      Data.data([
        { id: "one", title: "One" },
        { id: "two", title: "Two" },
        { id: "three", title: "Three" },
        { id: "four", title: "Four" }
      ])
    );
    let value = ReactForms.useFormValueState({
      value: {
        message: "Hello world!"
      }
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        message: "Hello world!"
      },
      schema: {
        type: "object",
        properties: {
          message: {
            format(value) {
              if (value !== "three") {
                return 'Must have "Three" selected';
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
            <Field
              data={data}
              formValue={value.select("message")}
              label="Greeting"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="read only">
            <Field
              data={data}
              readOnly={true}
              formValue={value.select("message")}
              label="Greeting"
            />
          </Fixture.DemoItem>
          <Fixture.DemoItem label="has hint">
            <Field
              data={data}
              formValue={value.select("message")}
              label="Greeting"
              hint="Enter some message here"
            />
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />
          <Fixture.DemoItem label="error">
            <Field
              data={data}
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
