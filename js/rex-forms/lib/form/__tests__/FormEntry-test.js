// @flow

import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { Provider } from "rex-i18n";
import FormEntry from "../FormEntry.js";
import DatePicker from "../widget/DatePicker.js";
import * as types from "../../types.js";

// NOTE(andreypopp): mocking it as it's not compatible with react-test-renderer
jest.mock("../MarkupString.js", () => {
  return {
    __esModule: true,

    default: function MarkupStringMock(props) {
      return <div>STRING</div>;
    }
  };
});

let instrument: types.RIOSInstrument = {
  id: "urn:instrument",
  version: "1.0",
  title: "title",
  record: [
    {
      id: "q_number",
      type: "integer"
    },
    {
      id: "q_text",
      type: "text"
    }
  ],
  types: {}
};

test("date field with useLocaleFormat", () => {
  let instrument: types.RIOSInstrument = {
    id: "urn:instrument",
    version: "1.0",
    title: "title",
    record: [
      {
        id: "field1",
        type: "date"
      }
    ],
    types: {}
  };
  let form: types.RIOSForm = {
    instrument: {
      id: instrument.id,
      version: instrument.version
    },
    defaultLocalization: "en",
    pages: [
      {
        id: "page1",
        elements: [
          {
            type: "question",
            options: {
              fieldId: "field1",
              text: { en: "Enter text" },
              widget: {
                type: "datePicker",
                options: {
                  useLocaleFormat: true
                }
              }
            }
          }
        ]
      }
    ]
  };
  let assessment: types.RIOSAssessment = {
    instrument: {
      id: instrument.id,
      version: instrument.version
    },
    values: {
      field1: {
        value: "2012-12-24"
      }
    }
  };

  let currentAssessment: types.RIOSAssessment;
  let onChange = change => {
    currentAssessment = change.getAssessment();
  };

  let renderer = TestRenderer.create(
    <Provider>
      <FormEntry
        instrument={instrument}
        form={form}
        assessment={assessment}
        onChange={onChange}
      />
    </Provider>
  );
  let formEntry = renderer.root.findByType(FormEntry);

  let formState = formEntry.instance.formState;

  // It should reformat form value to a localized value
  expect(formState.value.value).toEqual({
    field1: { value: "12-24-2012" }
  });
});

test("dateTime field with useLocaleFormat", () => {
  let instrument: types.RIOSInstrument = {
    id: "urn:instrument",
    version: "1.0",
    title: "title",
    record: [
      {
        id: "field1",
        type: "dateTime"
      }
    ],
    types: {}
  };
  let form: types.RIOSForm = {
    instrument: {
      id: instrument.id,
      version: instrument.version
    },
    defaultLocalization: "en",
    pages: [
      {
        id: "page1",
        elements: [
          {
            type: "question",
            options: {
              fieldId: "field1",
              text: { en: "Enter text" },
              widget: {
                type: "dateTimePicker",
                options: {
                  useLocaleFormat: true
                }
              }
            }
          }
        ]
      }
    ]
  };
  let assessment: types.RIOSAssessment = {
    instrument: {
      id: instrument.id,
      version: instrument.version
    },
    values: {
      field1: {
        value: "2012-12-24T12:12:12"
      }
    }
  };

  let currentAssessment: types.RIOSAssessment;
  let onChange = change => {
    currentAssessment = change.getAssessment();
  };

  let renderer = TestRenderer.create(
    <Provider>
      <FormEntry
        instrument={instrument}
        form={form}
        assessment={assessment}
        onChange={onChange}
      />
    </Provider>
  );
  let formEntry = renderer.root.findByType(FormEntry);

  let formState = formEntry.instance.formState;

  // It should reformat form value to a localized value
  expect(formState.value.value).toEqual({
    field1: { value: "12-24-2012T12:12:12" }
  });
});
