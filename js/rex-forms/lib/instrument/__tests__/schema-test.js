/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import assert from "assert";
import { validate } from "react-forms";
import { fromInstrument } from "../schema";

let MOCK_ENV = {
  i18n: {
    gettext: msg => {
      return msg;
    },
  },
};

function assertValid(schema, value) {
  let errors = validate(schema, value);
  assert.deepEqual(errors, []);
}

function assertInvalid(schema, value, expectedErrors) {
  function shallowError(error) {
    return { message: error.message.toString(), field: error.field };
  }
  let errors = validate(schema, value);
  assert(expectedErrors.length > 0, "Invalid expectation provided");
  assert.deepEqual(errors.map(shallowError), expectedErrors.map(shallowError));
}

describe("rex-forms/lib/instrument/schema", function() {
  describe("assigning event keys", function() {
    let instrument = {
      record: [
        { id: "simple", type: "text" },
        {
          id: "recordList",
          type: {
            base: "recordList",
            record: [
              { id: "item1", type: "text" },
              { id: "item2", type: "text" },
            ],
          },
        },
        {
          id: "matrix",
          type: {
            base: "matrix",
            rows: [{ id: "row1" }, { id: "row2" }],
            columns: [
              { id: "col1", type: "text" },
              { id: "col2", type: "text" },
            ],
          },
        },
      ],
    };

    let schema = fromInstrument(instrument, MOCK_ENV);

    it("assigns a correct event key for simple fields", function() {
      assert(schema.properties.simple.form);
      assert(schema.properties.simple.form.eventKey === "simple");
    });

    it("assigns a correct event key for recordList record fields", function() {
      assert(
        schema.properties.recordList.properties.value.items.properties.item1
          .form,
      );
      assert(
        schema.properties.recordList.properties.value.items.properties.item1
          .form.eventKey === "recordList.item1",
      );
      assert(
        schema.properties.recordList.properties.value.items.properties.item2
          .form,
      );
      assert(
        schema.properties.recordList.properties.value.items.properties.item2
          .form.eventKey === "recordList.item2",
      );
    });

    it("assigns a correct event key for matrix cell fields", function() {
      assert(
        schema.properties.matrix.properties.value.properties.row1.properties
          .col1.form,
      );
      assert(
        schema.properties.matrix.properties.value.properties.row1.properties
          .col1.form.eventKey === "matrix.row1.col1",
      );
      assert(
        schema.properties.matrix.properties.value.properties.row1.properties
          .col2.form,
      );
      assert(
        schema.properties.matrix.properties.value.properties.row1.properties
          .col2.form.eventKey === "matrix.row1.col2",
      );
      assert(
        schema.properties.matrix.properties.value.properties.row2.properties
          .col1.form,
      );
      assert(
        schema.properties.matrix.properties.value.properties.row2.properties
          .col1.form.eventKey === "matrix.row2.col1",
      );
      assert(
        schema.properties.matrix.properties.value.properties.row2.properties
          .col2.form,
      );
      assert(
        schema.properties.matrix.properties.value.properties.row2.properties
          .col2.form.eventKey === "matrix.row2.col2",
      );
    });
  });

  describe("simple cases", function() {
    it("validates simple schema", function() {
      let instrument = {
        record: [
          { id: "firstName", type: "text" },
          { id: "lastName", type: "text" },
        ],
      };
      let schema = fromInstrument(instrument, MOCK_ENV);
      assertValid(schema, {});
      assertValid(schema, { firstName: { value: "ok" } });
      assertValid(schema, { lastName: { value: "ok" } });
      assertValid(schema, {
        firstName: { value: "ok" },
        lastName: { value: "ok" },
      });
      assertInvalid(schema, { firstName: "notok" }, [
        { message: "is the wrong type", field: "data.firstName" },
      ]);
      assertInvalid(schema, { lastName: "notok" }, [
        { message: "is the wrong type", field: "data.lastName" },
      ]);
    });

    it("validates simple schema (required fields)", function() {
      let instrument = {
        record: [
          { id: "firstName", type: "text", required: true },
          { id: "lastName", type: "text" },
        ],
      };
      let schema = fromInstrument(instrument, MOCK_ENV);
      assertValid(schema, { firstName: { value: "ok" } });
      assertValid(schema, {
        firstName: { value: "ok" },
        lastName: { value: "ok" },
      });
      assertInvalid(schema, { lastName: { value: "ok" } }, [
        { message: "is required", field: "data.firstName.value" },
      ]);
      assertInvalid(schema, {}, [
        { message: "is required", field: "data.firstName.value" },
      ]);
    });

    describe("annotation", function() {
      it('annotation "none")', function() {
        let instrument = {
          record: [{ id: "firstName", type: "text", annotation: "none" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { firstName: { value: "ok" } });
      });

      it('annotation "optional")', function() {
        let instrument = {
          record: [{ id: "firstName", type: "text", annotation: "optional" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { firstName: { annotation: "ann" } });
      });

      it('required field, annotation "optional")', function() {
        let instrument = {
          record: [
            {
              id: "firstName",
              type: "text",
              annotation: "optional",
              required: true,
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertInvalid(schema, { firstName: {} }, [
          { message: "is required", field: "data.firstName.value" },
        ]);
      });

      it('annotation "required")', function() {
        let instrument = {
          record: [{ id: "firstName", type: "text", annotation: "required" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { firstName: { value: "ok" } });
        assertValid(schema, { firstName: { annotation: "ann" } });
        assertInvalid(schema, {}, [
          {
            message: "You must provide a response for this field.",
            field: "data.firstName.annotation",
          },
        ]);
        assertInvalid(schema, { firstName: {} }, [
          {
            message: "You must provide a response for this field.",
            field: "data.firstName.annotation",
          },
        ]);
      });

      it('required field, annotation "required")', function() {
        let instrument = {
          record: [
            {
              id: "firstName",
              type: "text",
              annotation: "required",
              required: true,
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertInvalid(schema, { firstName: {} }, [
          { message: "is required", field: "data.firstName.value" },
        ]);
      });
    });

    describe("explanation", function() {
      it('explanation "none")', function() {
        let instrument = {
          record: [{ id: "firstName", type: "text", explanation: "none" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
      });

      it('explanation "optional")', function() {
        let instrument = {
          record: [{ id: "firstName", type: "text", explanation: "optional" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { firstName: { explanation: "ok" } });
      });

      it('explanation "required")', function() {
        let instrument = {
          record: [{ id: "firstName", type: "text", explanation: "required" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { firstName: { explanation: "ok" } });
        assertInvalid(schema, { firstName: {} }, [
          { message: "is required", field: "data.firstName.explanation" },
        ]);
      });
    });

    describe('"text" type', function() {
      it("validates", function() {
        let instrument = {
          record: [{ id: "key", type: "text" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: {} });
        assertValid(schema, { key: { value: "" } });
        assertValid(schema, { key: { value: "ok" } });
        assertInvalid(schema, { key: { value: 32 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
      });

      it("validates with min length constraint", function() {
        let instrument = {
          record: [{ id: "key", type: { base: "text", length: { min: 2 } } }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "nice" } });
        assertInvalid(schema, { key: { value: "x" } }, [
          {
            message: "Must be at least %(min)s characters.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 32 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
      });

      it("validates with max length constraint", function() {
        let instrument = {
          record: [{ id: "key", type: { base: "text", length: { max: 2 } } }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "xx" } });
        assertInvalid(schema, { key: { value: "nice" } }, [
          {
            message: "Cannot be more than %(max)s characters.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 32 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
      });

      it("validates with max and min length constraints", function() {
        let instrument = {
          record: [
            { id: "key", type: { base: "text", length: { max: 4, min: 2 } } },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "xx" } });
        assertValid(schema, { key: { value: "xxx" } });
        assertValid(schema, { key: { value: "xxxx" } });
        assertInvalid(schema, { key: { value: "oops!" } }, [
          {
            message: "Must be between %(min)s and %(max)s characters.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: "x" } }, [
          {
            message: "Must be between %(min)s and %(max)s characters.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 32 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
      });

      it("validates with pattern constraint", function() {
        let instrument = {
          record: [{ id: "key", type: { base: "text", pattern: "https?:" } }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "http:" } });
        assertValid(schema, { key: { value: "https:" } });
        assertInvalid(schema, { key: { value: "ftp:" } }, [
          {
            message: "Does not match the expected pattern.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 32 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
      });
    });

    describe('"integer" type', function() {
      it("validates", function() {
        let instrument = {
          record: [{ id: "key", type: "integer" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: {} });
        assertValid(schema, { key: { value: 0 } });
        assertValid(schema, { key: { value: 42 } });
        assertInvalid(schema, { key: { value: 42.5 } }, [
          { message: "Not a valid whole number.", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: "oops" } }, [
          { message: "Not a valid whole number.", field: "data.key.value" },
        ]);
      });

      it("validates with min range constraint", function() {
        let instrument = {
          record: [{ id: "key", type: { base: "integer", range: { min: 2 } } }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: 42 } });
        assertInvalid(schema, { key: { value: 1 } }, [
          { message: "Must be at least %(min)s.", field: "data.key.value" },
        ]);
      });

      it("validates with max range constraint", function() {
        let instrument = {
          record: [
            { id: "key", type: { base: "integer", range: { max: 42 } } },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: 42 } });
        assertInvalid(schema, { key: { value: 43 } }, [
          { message: "Cannot be beyond %(max)s.", field: "data.key.value" },
        ]);
      });

      it("validates with min and max range constraints", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: { base: "integer", range: { min: 10, max: 42 } },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: 42 } });
        assertInvalid(schema, { key: { value: 43 } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 0 } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
      });
    });

    describe('"float" type', function() {
      it("validates", function() {
        let instrument = {
          record: [{ id: "key", type: "float" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: {} });
        assertValid(schema, { key: { value: 0 } });
        assertValid(schema, { key: { value: 42 } });
        assertValid(schema, { key: { value: 42.5 } });
        assertInvalid(schema, { key: { value: "oops" } }, [
          { message: "Not a valid number.", field: "data.key.value" },
        ]);
      });

      it("validates with min range constraint", function() {
        let instrument = {
          record: [{ id: "key", type: { base: "float", range: { min: 2 } } }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: 42 } });
        assertInvalid(schema, { key: { value: 1 } }, [
          { message: "Must be at least %(min)s.", field: "data.key.value" },
        ]);
      });

      it("validates with max range constraint", function() {
        let instrument = {
          record: [{ id: "key", type: { base: "float", range: { max: 42 } } }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: 42 } });
        assertInvalid(schema, { key: { value: 43 } }, [
          { message: "Cannot be beyond %(max)s.", field: "data.key.value" },
        ]);
      });

      it("validates with min and max range constraints", function() {
        let instrument = {
          record: [
            { id: "key", type: { base: "float", range: { min: 10, max: 42 } } },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: 42 } });
        assertInvalid(schema, { key: { value: 43 } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 0 } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
      });
    });

    it('validates "boolean" base type', function() {
      let instrument = {
        record: [{ id: "key", type: "boolean" }],
      };
      let schema = fromInstrument(instrument, MOCK_ENV);
      assertValid(schema, {});
      assertValid(schema, { key: {} });
      assertValid(schema, { key: { value: true } });
      assertValid(schema, { key: { value: false } });
      assertInvalid(schema, { key: { value: "oops" } }, [
        { message: "is the wrong type", field: "data.key.value" },
      ]);
    });

    describe('"date" type', function() {
      it("validates", function() {
        let instrument = {
          record: [{ id: "key", type: "date" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: {} });
        assertValid(schema, { key: { value: "2012-12-12" } });
        assertInvalid(schema, { key: { value: 42 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: "oops" } }, [
          {
            message: "This must be entered in the form: YYYY-MM-DD",
            field: "data.key.value",
          },
        ]);
      });

      it("validates with min range constraint", function() {
        let instrument = {
          record: [
            { id: "key", type: { base: "date", range: { min: "1987-05-08" } } },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "2016-12-12" } });
        assertInvalid(schema, { key: { value: "1961-04-24" } }, [
          { message: "Must be at least %(min)s.", field: "data.key.value" },
        ]);
      });

      it("validates with max range constraint", function() {
        let instrument = {
          record: [
            { id: "key", type: { base: "date", range: { max: "1987-05-08" } } },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "1961-04-24" } });
        assertInvalid(schema, { key: { value: "1991-05-22" } }, [
          { message: "Cannot be beyond %(max)s.", field: "data.key.value" },
        ]);
      });

      it("validates with min and max range constraints", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "date",
                range: { min: "1987-05-08", max: "1991-05-22" },
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "1988-04-24" } });
        assertInvalid(schema, { key: { value: "1992-05-22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: "2016-05-22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
      });
    });

    describe('"dateTime" type', function() {
      it("validates", function() {
        let instrument = {
          record: [{ id: "key", type: "dateTime" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: {} });
        assertValid(schema, { key: { value: "2012-12-12T12:12:12" } });
        assertInvalid(schema, { key: { value: "2012-12-12" } }, [
          {
            message: "This must be entered in the form: YYYY-MM-DDTHH:MM[:SS]",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 42 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: "oops" } }, [
          {
            message: "This must be entered in the form: YYYY-MM-DDTHH:MM[:SS]",
            field: "data.key.value",
          },
        ]);
      });

      it("validates with min range constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: { base: "dateTime", range: { min: "1987-05-08T22:22:22" } },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "2016-12-12T22:22:22" } });
        assertInvalid(schema, { key: { value: "1961-04-24T22:22:22" } }, [
          { message: "Must be at least %(min)s.", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: "1987-05-08T19:22:22" } }, [
          { message: "Must be at least %(min)s.", field: "data.key.value" },
        ]);
      });

      it("validates with max range constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: { base: "dateTime", range: { max: "1987-05-08T22:22:22" } },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "1961-04-24T22:22:22" } });
        assertInvalid(schema, { key: { value: "1991-05-22T22:22:22" } }, [
          { message: "Cannot be beyond %(max)s.", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: "1987-05-08T23:22:22" } }, [
          { message: "Cannot be beyond %(max)s.", field: "data.key.value" },
        ]);
      });

      it("validates with min and max range constraints", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "dateTime",
                range: {
                  min: "1987-05-08T22:22:22",
                  max: "1991-05-22T22:22:22",
                },
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "1988-04-24T22:22:22" } });
        assertInvalid(schema, { key: { value: "1992-05-22T22:22:22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: "2016-05-22T22:22:22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: "1991-05-22T23:22:22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: "1987-05-08T21:22:22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
      });
    });

    describe('"time" type', function() {
      it("validates", function() {
        let instrument = {
          record: [{ id: "key", type: "time" }],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: {} });
        assertValid(schema, { key: { value: "12:12:12" } });
        assertInvalid(schema, { key: { value: "2012-12-12" } }, [
          {
            message: "This must be entered in the form: HH:MM[:SS]",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: 42 } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: "oops" } }, [
          {
            message: "This must be entered in the form: HH:MM[:SS]",
            field: "data.key.value",
          },
        ]);
      });

      it("validates with min range constraint", function() {
        let instrument = {
          record: [
            { id: "key", type: { base: "time", range: { min: "22:22:22" } } },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "22:22:22" } });
        assertInvalid(schema, { key: { value: "19:22:22" } }, [
          { message: "Must be at least %(min)s.", field: "data.key.value" },
        ]);
      });

      it("validates with max range constraint", function() {
        let instrument = {
          record: [
            { id: "key", type: { base: "time", range: { max: "22:22:22" } } },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "22:22:22" } });
        assertInvalid(schema, { key: { value: "23:22:22" } }, [
          { message: "Cannot be beyond %(max)s.", field: "data.key.value" },
        ]);
      });

      it("validates with min and max range constraints", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "time",
                range: { min: "12:22:22", max: "22:22:22" },
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: "21:22:22" } });
        assertInvalid(schema, { key: { value: "23:22:22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: "10:22:22" } }, [
          {
            message: "Must be between %(min)s and %(max)s.",
            field: "data.key.value",
          },
        ]);
      });
    });

    it('validates "enumeration" type', function() {
      let instrument = {
        record: [
          {
            id: "key",
            type: {
              base: "enumeration",
              enumerations: {
                a: { description: "A" },
                b: { description: "B" },
              },
            },
          },
        ],
      };
      let schema = fromInstrument(instrument, MOCK_ENV);
      assertValid(schema, { key: { value: "a" } });
      assertValid(schema, { key: { value: "b" } });
      assertInvalid(schema, { key: { value: "c" } }, [
        { message: "must be an enum value", field: "data.key.value" },
      ]);
      assertInvalid(schema, { key: { value: 42 } }, [
        { message: "must be an enum value", field: "data.key.value" },
      ]);
    });

    it('validates "enumeration" type (via type collection)', function() {
      let instrument = {
        record: [
          {
            id: "key",
            type: "ab",
          },
        ],
        types: {
          ab: {
            base: "enumeration",
            enumerations: {
              a: { description: "A" },
              b: { description: "B" },
            },
          },
        },
      };
      let schema = fromInstrument(instrument, MOCK_ENV);
      assertValid(schema, { key: { value: "a" } });
      assertValid(schema, { key: { value: "b" } });
      assertInvalid(schema, { key: { value: "c" } }, [
        { message: "must be an enum value", field: "data.key.value" },
      ]);
      assertInvalid(schema, { key: { value: 42 } }, [
        { message: "must be an enum value", field: "data.key.value" },
      ]);
    });

    describe("enumerationSet", function() {
      it("validates", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "enumerationSet",
                enumerations: {
                  a: { description: "A" },
                  b: { description: "B" },
                },
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: ["a"] } });
        assertValid(schema, { key: { value: ["b"] } });
        assertValid(schema, { key: { value: ["a", "b"] } });
        assertInvalid(schema, { key: { value: "c" } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: ["c"] } }, [
          { message: "must be an enum value", field: "data.key.value.0" },
        ]);
        assertInvalid(schema, { key: { value: [42] } }, [
          { message: "must be an enum value", field: "data.key.value.0" },
        ]);
      });

      it("validates with min length constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "enumerationSet",
                length: { min: 2 },
                enumerations: {
                  a: { description: "A" },
                  b: { description: "B" },
                  c: { description: "C" },
                },
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: ["a", "b"] } });
        assertInvalid(schema, { key: { value: ["a"] } }, [
          {
            message: "Must select at least %(min)s choices.",
            field: "data.key.value",
          },
        ]);
      });

      it("validates with max length constraing", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "enumerationSet",
                length: { max: 2 },
                enumerations: {
                  a: { description: "A" },
                  b: { description: "B" },
                  c: { description: "C" },
                },
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: ["a"] } });
        assertValid(schema, { key: { value: ["a", "b"] } });
        assertInvalid(schema, { key: { value: ["a", "b", "c"] } }, [
          {
            message: "Cannot select more than %(max)s choices.",
            field: "data.key.value",
          },
        ]);
      });

      it("validates with min and max length constraing", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "enumerationSet",
                length: { min: 2, max: 3 },
                enumerations: {
                  a: { description: "A" },
                  b: { description: "B" },
                  c: { description: "C" },
                  d: { description: "D" },
                },
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: ["a", "b"] } });
        assertValid(schema, { key: { value: ["a", "b", "c"] } });
        assertInvalid(schema, { key: { value: ["a"] } }, [
          {
            message: "Must select between %(min)s and %(max)s choices.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: ["a", "b", "c", "d"] } }, [
          {
            message: "Must select between %(min)s and %(max)s choices.",
            field: "data.key.value",
          },
        ]);
      });
    });

    describe("recordList", function() {
      it("validates", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "recordList",
                record: [
                  { id: "a", type: "text", required: true },
                  { id: "b", type: "text" },
                ],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: { value: [] } });
        assertValid(schema, { key: { value: [{ a: { value: "a" } }] } });
        assertValid(schema, {
          key: { value: [{ a: { value: "a" } }, { a: { value: "a1" } }] },
        });
        assertInvalid(schema, { key: { value: "a" } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
        assertInvalid(schema, { key: { value: [{ b: { value: "b" } }] } }, [
          { message: "is required", field: "data.key.value.0.a.value" },
        ]);
        assertInvalid(schema, { key: { value: [{}] } }, [
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.0",
          },
          { message: "is required", field: "data.key.value.0.a.value" },
        ]);
      });

      it("validates with required constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              required: true,
              type: {
                base: "recordList",
                record: [{ id: "a", type: "text" }, { id: "b", type: "text" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertInvalid(schema, { key: { value: [] } }, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: undefined } }, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: null } }, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, {}, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: [{ a: { value: null } }] } }, [
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.0",
          },
        ]);
      });

      it("validates with min length constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "recordList",
                length: { min: 2 },
                record: [{ id: "a", type: "text" }, { id: "b", type: "text" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: [] } });
        assertInvalid(schema, { key: { value: [{}, {}] } }, [
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.0",
          },
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.1",
          },
        ]);
        assertValid(schema, { key: { value: undefined } });
        assertValid(schema, { key: { value: null } });
        assertValid(schema, {});
        assertInvalid(schema, { key: { value: [{ a: { value: "foo" } }] } }, [
          {
            message: "Must enter at least %(min)s records.",
            field: "data.key.value",
          },
        ]);
        assertValid(schema, {
          key: { value: [{ a: { value: "foo" } }, { a: { value: "bar" } }] },
        });
        assertInvalid(
          schema,
          { key: { value: [{ a: { value: "foo" } }, {}] } },
          [
            {
              message:
                "You must respond to at least one question in this record.",
              field: "data.key.value.1",
            },
          ],
        );
      });

      it("validates with max length constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "recordList",
                length: { max: 2 },
                record: [{ id: "a", type: "text" }, { id: "b", type: "text" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: [] } });
        assertInvalid(schema, { key: { value: [{}] } }, [
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.0",
          },
        ]);
        assertInvalid(schema, { key: { value: [{}, {}] } }, [
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.0",
          },
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.1",
          },
        ]);
        assertInvalid(schema, { key: { value: [{}, {}, {}] } }, [
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.0",
          },
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.1",
          },
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.2",
          },
        ]);
        assertValid(schema, { key: { value: undefined } });
        assertValid(schema, { key: { value: null } });
        assertValid(schema, {});
        assertValid(schema, { key: { value: [{ a: { value: "foo" } }] } });
        assertValid(schema, {
          key: { value: [{ a: { value: "foo" } }, { a: { value: "foo" } }] },
        });
        assertInvalid(
          schema,
          {
            key: {
              value: [{ a: { value: "foo" } }, { a: { value: "foo" } }, {}],
            },
          },
          [
            {
              message:
                "You must respond to at least one question in this record.",
              field: "data.key.value.2",
            },
          ],
        );
        assertInvalid(
          schema,
          {
            key: {
              value: [
                { a: { value: "foo" } },
                { a: { value: "foo" } },
                { a: { value: "foo" } },
              ],
            },
          },
          [
            {
              message: "Cannot enter more than %(max)s records.",
              field: "data.key.value",
            },
          ],
        );
      });

      it("validates with max and min length constraints", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "recordList",
                length: { min: 2, max: 3 },
                record: [{ id: "a", type: "text" }, { id: "b", type: "text" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, { key: { value: [] } });
        assertInvalid(schema, { key: { value: [{}, {}] } }, [
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.0",
          },
          {
            message:
              "You must respond to at least one question in this record.",
            field: "data.key.value.1",
          },
        ]);
        assertValid(schema, { key: { value: undefined } });
        assertValid(schema, { key: { value: null } });
        assertValid(schema, {});
        assertInvalid(schema, { key: { value: [{ a: { value: "foo" } }] } }, [
          {
            message: "Must enter between %(min)s and %(max)s records.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(
          schema,
          { key: { value: [{ a: { value: "foo" } }, {}] } },
          [
            {
              message:
                "You must respond to at least one question in this record.",
              field: "data.key.value.1",
            },
          ],
        );
        assertValid(schema, {
          key: { value: [{ a: { value: "foo" } }, { a: { value: "foo" } }] },
        });
        assertValid(schema, {
          key: {
            value: [
              { a: { value: "foo" } },
              { a: { value: "foo" } },
              { a: { value: "foo" } },
            ],
          },
        });
        assertInvalid(
          schema,
          {
            key: {
              value: [
                { a: { value: "foo" } },
                { a: { value: "foo" } },
                { a: { value: "foo" } },
                {},
              ],
            },
          },
          [
            {
              message:
                "You must respond to at least one question in this record.",
              field: "data.key.value.3",
            },
          ],
        );
        assertInvalid(
          schema,
          {
            key: {
              value: [
                { a: { value: "foo" } },
                { a: { value: "foo" } },
                { a: { value: "foo" } },
                { a: { value: "foo" } },
              ],
            },
          },
          [
            {
              message: "Must enter between %(min)s and %(max)s records.",
              field: "data.key.value",
            },
          ],
        );
      });
    });

    describe("matrix", function() {
      it("validates", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "matrix",
                columns: [
                  { id: "col1", type: "text" },
                  { id: "col2", type: "integer" },
                ],
                rows: [{ id: "row1" }, { id: "row2" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: { value: {} } });
        assertValid(schema, { key: { value: null } });
        assertValid(schema, { key: { value: undefined } });
        assertValid(schema, {
          key: {
            value: {
              row1: { col1: { value: "a" }, col2: { value: 1 } },
              row2: { col1: { value: "a" }, col2: { value: 2 } },
            },
          },
        });
        assertInvalid(schema, { key: { value: "a" } }, [
          { message: "is the wrong type", field: "data.key.value" },
        ]);
        assertInvalid(
          schema,
          {
            key: {
              value: {
                row1: { col1: { value: "a" }, col2: { value: 1 } },
                row2: { col1: { value: "a" }, col2: { value: "foo" } },
              },
            },
          },
          [
            {
              message: "Not a valid whole number.",
              field: "data.key.value.row2.col2.value",
            },
          ],
        );
      });

      it("validates with required constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              required: true,
              type: {
                base: "matrix",
                columns: [
                  { id: "col1", type: "text" },
                  { id: "col2", type: "integer" },
                ],
                rows: [{ id: "row1" }, { id: "row2" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertInvalid(schema, {}, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: null } }, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: undefined } }, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(schema, { key: { value: {} } }, [
          {
            message: "You must provide a response for this field.",
            field: "data.key.value",
          },
        ]);
        assertInvalid(
          schema,
          {
            key: {
              value: {
                row1: { col1: { value: null }, col2: { value: null } },
                row2: { col1: { value: null }, col2: { value: null } },
              },
            },
          },
          [
            {
              message: "You must provide a response for this field.",
              field: "data.key.value",
            },
          ],
        );
        assertValid(schema, {
          key: {
            value: {
              row1: { col1: { value: "a" }, col2: { value: null } },
              row2: { col1: { value: null }, col2: { value: null } },
            },
          },
        });
      });

      it("validates with required row constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "matrix",
                columns: [
                  { id: "col1", type: "text" },
                  { id: "col2", type: "integer" },
                ],
                rows: [{ id: "row1", required: true }, { id: "row2" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertInvalid(schema, {}, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(schema, { key: { value: null } }, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(schema, { key: { value: undefined } }, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(schema, { key: { value: {} } }, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(
          schema,
          {
            key: {
              value: {
                row1: { col1: { value: null }, col2: { value: null } },
                row2: { col1: { value: null }, col2: { value: null } },
              },
            },
          },
          [
            {
              message: "You must provide a response for this row.",
              field: "data.key.value.row1",
            },
          ],
        );
        assertValid(schema, {
          key: {
            value: {
              row1: { col1: { value: "a" }, col2: { value: null } },
              row2: { col1: { value: null }, col2: { value: null } },
            },
          },
        });
      });

      it("validates with required column constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "matrix",
                columns: [
                  { id: "col1", type: "text", required: true },
                  { id: "col2", type: "integer" },
                ],
                rows: [{ id: "row1" }, { id: "row2" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertValid(schema, {});
        assertValid(schema, { key: { value: {} } });
        assertValid(schema, { key: { value: null } });
        assertValid(schema, { key: { value: undefined } });
        assertValid(schema, {
          key: {
            value: {
              row1: { col1: { value: null }, col2: { value: null } },
              row2: { col1: { value: null }, col2: { value: null } },
            },
          },
        });
        assertInvalid(
          schema,
          {
            key: {
              value: {
                row1: { col1: { value: null }, col2: { value: 1 } },
                row2: { col1: { value: null }, col2: { value: null } },
              },
            },
          },
          [
            {
              message: "You must provide a response for this field.",
              field: "data.key.value.row1.col1.value",
            },
          ],
        );
        assertValid(schema, {
          key: {
            value: {
              row1: { col1: { value: "a" }, col2: { value: null } },
              row2: { col1: { value: null }, col2: { value: null } },
            },
          },
        });
      });

      it("validates with required row AND required column constraint", function() {
        let instrument = {
          record: [
            {
              id: "key",
              type: {
                base: "matrix",
                columns: [
                  { id: "col1", type: "text", required: true },
                  { id: "col2", type: "integer" },
                ],
                rows: [{ id: "row1", required: true }, { id: "row2" }],
              },
            },
          ],
        };
        let schema = fromInstrument(instrument, MOCK_ENV);
        assertInvalid(schema, {}, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(schema, { key: { value: {} } }, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(schema, { key: { value: null } }, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(schema, { key: { value: undefined } }, [
          {
            message: "You must provide a response for this row.",
            field: "data.key.value.row1",
          },
        ]);
        assertInvalid(
          schema,
          {
            key: {
              value: {
                row1: { col1: { value: null }, col2: { value: null } },
                row2: { col1: { value: null }, col2: { value: null } },
              },
            },
          },
          [
            {
              message: "You must provide a response for this row.",
              field: "data.key.value.row1",
            },
          ],
        );
        assertInvalid(
          schema,
          {
            key: {
              value: {
                row1: { col1: { value: null }, col2: { value: 1 } },
                row2: { col1: { value: null }, col2: { value: null } },
              },
            },
          },
          [
            {
              message: "You must provide a response for this field.",
              field: "data.key.value.row1.col1.value",
            },
          ],
        );
        assertInvalid(
          schema,
          {
            key: {
              value: {
                row1: { col1: { value: null }, col2: { value: null } },
                row2: { col1: { value: null }, col2: { value: 1 } },
              },
            },
          },
          [
            {
              message: "You must provide a response for this row.",
              field: "data.key.value.row1",
            },
            {
              message: "You must provide a response for this field.",
              field: "data.key.value.row2.col1.value",
            },
          ],
        );
        assertValid(schema, {
          key: {
            value: {
              row1: { col1: { value: "a" }, col2: { value: null } },
              row2: { col1: { value: null }, col2: { value: null } },
            },
          },
        });
      });
    });
  });
});
