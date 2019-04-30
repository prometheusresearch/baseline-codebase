/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as Fixture from "rex-ui/Fixture";
import * as ReactForms from "react-forms";
import { Fieldset } from "./Fieldset";
import { RepeatingFieldset } from "./RepeatingFieldset";
import { Field } from "./Field";
import { IntegerField } from "./IntegerField";
import { FormLayout } from "./Layout";
import { FormValueDebug } from "./FormValueDebug";

export default Fixture.fixture({
  component: RepeatingFieldset,
  render(RepeatingFieldset, props) {
    let schema = {
      type: "object",
      properties: {
        users: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              age: { type: "number" }
            }
          },
          format(values) {
            if (values == null) {
              return true;
            }
            let first = values[0];
            if (first == null) {
              return true;
            }
            if (first && first.age != null && first.age < 30) {
              return "First user's age is less than 30";
            } else {
              return true;
            }
          }
        }
      }
    };
    let value = ReactForms.useFormValueState({
      value: {
        users: [
          {
            name: "Marry Poppins",
            age: 30
          }
        ]
      },
      schema
    });
    let valueWithError = ReactForms.useFormValueState({
      value: {
        users: [
          {
            name: "John Doe",
            age: 29
          }
        ]
      },
      schema
    });
    return (
      <Fixture.Demo>
        <FormLayout>
          <Fixture.DemoItem label="regular">
            <RepeatingFieldset formValue={value.select("users")}>
              <Field label="Name" select="name" />
              <IntegerField label="Age" select="age" />
            </RepeatingFieldset>
          </Fixture.DemoItem>

          <Fixture.DemoItem label="with label">
            <RepeatingFieldset formValue={value.select("users")} label="Users">
              <Field label="Name" select="name" />
              <IntegerField label="Age" select="age" />
            </RepeatingFieldset>
          </Fixture.DemoItem>

          <Fixture.DemoItem label="with hint">
            <RepeatingFieldset
              formValue={value.select("users")}
              label="Users"
              hint="Enter users info here"
            >
              <Field label="Name" select="name" />
              <IntegerField label="Age" select="age" />
            </RepeatingFieldset>
          </Fixture.DemoItem>

          <FormValueDebug formValue={value} />

          <Fixture.DemoItem label="with error">
            <RepeatingFieldset
              formValue={valueWithError.select("users")}
              label="User"
              hint="Enter user info here"
            >
              <Field label="Name" select="name" />
              <IntegerField label="Age" select="age" />
            </RepeatingFieldset>
          </Fixture.DemoItem>

          <FormValueDebug formValue={valueWithError} />
        </FormLayout>
      </Fixture.Demo>
    );
  }
});
