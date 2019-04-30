/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import * as ReactForms from "react-forms";
import { Fieldset } from "./Fieldset";
import { Field } from "./Field";
import { IntegerField } from "./IntegerField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: Fieldset,
  render(Fieldset, props) {
    let schema = {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            age: { type: "number" }
          },
          format(value) {
            if (value != null && value.age != null && value.age < 30) {
              return "User's age is less than 30";
            } else {
              return true;
            }
          }
        }
      }
    };
    let value = ReactForms.useFormValueState({
      value: {
        user: {
          name: "Marry Poppins",
          age: 30
        }
      },
      schema
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        user: {
          name: "John Doe",
          age: 29
        }
      },
      schema
    });
    return (
      <Fixture.Demo>
        <FormLayout>
          <Fixture.DemoItem label="regular">
            <Fieldset formValue={value.select("user")}>
              <Field
                label="Name"
                formValue={value.select("user").select("name")}
              />
              <IntegerField
                label="Age"
                formValue={value.select("user").select("age")}
              />
            </Fieldset>
          </Fixture.DemoItem>
          <Fixture.DemoItem label="with label">
            <Fieldset formValue={value.select("user")} label="User">
              <Field
                label="Name"
                formValue={value.select("user").select("name")}
              />
              <IntegerField
                label="Age"
                formValue={value.select("user").select("age")}
              />
            </Fieldset>
          </Fixture.DemoItem>
          <Fixture.DemoItem label="with hint">
            <Fieldset
              formValue={value.select("user")}
              label="User"
              hint="Enter user info here"
            >
              <Field
                label="Name"
                formValue={value.select("user").select("name")}
              />
              <IntegerField
                label="Age"
                formValue={value.select("user").select("age")}
              />
            </Fieldset>
          </Fixture.DemoItem>
          <FormValueDebug formValue={value} />

          <Fixture.DemoItem label="with error">
            <Fieldset
              formValue={valueWithError.select("user")}
              label="User"
              hint="Enter user info here"
            >
              <Field
                label="Name"
                formValue={valueWithError.select("user").select("name")}
              />
              <IntegerField
                label="Age"
                formValue={valueWithError.select("user").select("age")}
              />
            </Fieldset>
          </Fixture.DemoItem>
          <FormValueDebug formValue={valueWithError} />
        </FormLayout>
      </Fixture.Demo>
    );
  }
});
