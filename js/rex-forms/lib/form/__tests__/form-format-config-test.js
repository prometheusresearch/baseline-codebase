/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import assert from "assert";
import { validate } from "react-forms";
import { fromInstrument } from "../../instrument/schema";
import { getFormFormatConfig } from "../FormFormatConfig";

let MOCK_ENV = {
  i18n: {
    gettext: msg => {
      return msg;
    },
    config: {}
  },
  types: {}
};

let MOCK_ENV_EN = {
  i18n: {
    gettext: msg => {
      return msg;
    },
    config: {
      locale: "en"
    }
  },
  types: {}
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

/**
 * Matrix
 */
const matrix_instrument: any = {
  id: "urn:matrix-fields",
  version: "1.0",
  title: "Fields: Matrix",
  types: {
    basic: {
      base: "matrix",
      rows: [
        {
          id: "row1"
        },
        {
          id: "row2"
        }
      ],
      columns: [
        {
          id: "col1",
          type: "text"
        },
        {
          id: "col2",
          type: "dateTime"
        }
      ]
    }
  },
  record: [
    {
      id: "plain",
      type: "basic"
    }
  ]
};

const matrix_form_en = {
  instrument: {
    id: "urn:matrix-fields",
    version: "1.0"
  },
  defaultLocalization: "en",
  pages: [
    {
      id: "page1",
      elements: [
        {
          type: "header",
          options: {
            text: {
              en: "Constraints"
            }
          }
        },
        {
          type: "question",
          options: {
            fieldId: "plain",
            text: {
              en: "No constraints."
            },
            rows: [
              {
                id: "row2",
                text: {
                  en: 'The "Second" Row'
                }
              },
              {
                id: "row1",
                text: {
                  en: "Row1"
                }
              }
            ],
            questions: [
              {
                fieldId: "col1",
                text: {
                  en: "The first column"
                }
              },
              {
                fieldId: "col2",
                type: "dateTime",
                text: {
                  en: "Another column"
                },
                widget: {
                  type: "dateTimePicker",
                  options: {
                    useLocaleFormat: "en"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
};

const matrix_form = {
  instrument: {
    id: "urn:matrix-fields",
    version: "1.0"
  },
  defaultLocalization: "en",
  pages: [
    {
      id: "page1",
      elements: [
        {
          type: "header",
          options: {
            text: {
              en: "Constraints"
            }
          }
        },
        {
          type: "question",
          options: {
            fieldId: "plain",
            text: {
              en: "No constraints."
            },
            rows: [
              {
                id: "row2",
                text: {
                  en: 'The "Second" Row'
                }
              },
              {
                id: "row1",
                text: {
                  en: "Row1"
                }
              }
            ],
            questions: [
              {
                fieldId: "col1",
                text: {
                  en: "The first column"
                }
              },
              {
                fieldId: "col2",
                type: "dateTime",
                text: {
                  en: "Another column"
                }
              }
            ]
          }
        }
      ]
    }
  ]
};

/**
 * Records
 */
const records_instrument: any = {
  id: "urn:recordlist-fields",
  version: "1.0",
  title: "Fields: RecordList",
  types: {
    basic: {
      base: "recordList",
      record: [
        {
          id: "subfield1",
          type: "date"
        },
        {
          id: "subfield2",
          type: "dateTime"
        }
      ]
    }
  },
  record: [
    {
      id: "plain",
      type: "basic"
    }
  ]
};

const records_form_en = {
  instrument: {
    id: "urn:recordlist-fields",
    version: "1.0"
  },
  pages: [
    {
      id: "page1",
      elements: [
        {
          type: "header",
          options: {
            text: {
              en: "Constraints"
            }
          }
        },
        {
          type: "question",
          options: {
            fieldId: "plain",
            text: {
              en: "No constraints."
            },
            questions: [
              {
                fieldId: "subfield2",
                text: {
                  en: "First is 2."
                }
              },
              {
                fieldId: "subfield1",
                text: {
                  en: "Second is 1."
                },
                widget: {
                  options: {
                    useLocaleFormat: "en"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
};

const records_form = {
  instrument: {
    id: "urn:recordlist-fields",
    version: "1.0"
  },
  pages: [
    {
      id: "page1",
      elements: [
        {
          type: "header",
          options: {
            text: {
              en: "Constraints"
            }
          }
        },
        {
          type: "question",
          options: {
            fieldId: "plain",
            text: {
              en: "No constraints."
            },
            questions: [
              {
                fieldId: "subfield2",
                text: {
                  en: "First is 2."
                }
              },
              {
                fieldId: "subfield1",
                text: {
                  en: "Second is 1."
                }
              }
            ]
          }
        }
      ]
    }
  ]
};

describe("Test matrix date/dateTime fields", function() {
  describe("Test matrix form", function() {
    it("Validate values", function() {
      let formatConfig = getFormFormatConfig({
        form: (matrix_form: any),
        i18n: MOCK_ENV.i18n,
        instrument: matrix_instrument
      });

      let schema = fromInstrument(matrix_instrument, MOCK_ENV, {
        formatConfig
      });

      assertValid(schema, {
        plain: {
          value: {
            row1: {
              col2: { value: "2012-12-12T12:12" }
            },
            row2: {
              col2: { value: "2012-12-12T12:12:12" }
            }
          }
        }
      });
      assertInvalid(
        schema,
        {
          plain: {
            value: {
              row1: {
                col2: { value: 12345 }
              },
              row2: {
                col2: { value: "string" }
              }
            }
          }
        },
        [
          {
            field: "data.plain.value.row1.col2.value",
            message: "is the wrong type"
          },
          {
            field: "data.plain.value.row2.col2.value",
            message: "This must be entered in the form: YYYY-MM-DDTHH:MM[:SS]"
          }
        ]
      );
    });
  });

  describe("Test matrix form with useLocaleConfig 'en'", function() {
    it("Validate values", function() {
      let formatConfig = getFormFormatConfig({
        form: (matrix_form_en: any),
        i18n: MOCK_ENV_EN.i18n,
        instrument: matrix_instrument
      });

      let schema = fromInstrument(matrix_instrument, MOCK_ENV, {
        formatConfig
      });

      assertValid(schema, {
        plain: {
          value: {
            row1: {
              col2: { value: "12-12-2012T12:12" }
            },
            row2: {
              col2: { value: "12-12-2012T12:12:12" }
            }
          }
        }
      });
      assertInvalid(
        schema,
        {
          plain: {
            value: {
              row1: {
                col2: { value: 12345 }
              },
              row2: {
                col2: { value: "string" }
              }
            }
          }
        },
        [
          {
            field: "data.plain.value.row1.col2.value",
            message: "is the wrong type"
          },
          {
            field: "data.plain.value.row2.col2.value",
            message: "This must be entered in the form: MM-DD-YYYYTHH:MM[:SS]"
          }
        ]
      );
    });
  });
});

describe("Test records date/dateTime fields", function() {
  describe("Test records form", function() {
    it("Validate values", function() {
      let formatConfig = getFormFormatConfig({
        form: (records_form: any),
        i18n: MOCK_ENV_EN.i18n,
        instrument: records_instrument
      });

      let schema = fromInstrument(records_instrument, MOCK_ENV, {
        formatConfig
      });

      assertValid(schema, {
        plain: {
          value: [
            {
              subfield1: {
                value: "2012-12-12"
              }
            },
            {
              subfield2: {
                value: "2012-12-12T12:12"
              }
            }
          ]
        }
      });
    });
  });

  describe("Test records form with partially useLocaleConfig set 'en'", function() {
    it("Validate values", function() {
      let formatConfig = getFormFormatConfig({
        form: (records_form_en: any),
        i18n: MOCK_ENV_EN.i18n,
        instrument: records_instrument
      });

      let schema = fromInstrument(records_instrument, MOCK_ENV, {
        formatConfig
      });

      assertValid(schema, {
        plain: {
          value: [
            {
              subfield1: {
                value: "12-12-2012"
              }
            },
            {
              subfield2: {
                value: "2012-12-12T12:12"
              }
            }
          ]
        }
      });

      assertInvalid(
        schema,
        {
          plain: {
            value: [
              {
                subfield1: {
                  value: "2012-12-12"
                }
              },
              {
                subfield2: {
                  value: "2012-12-12T12:12"
                }
              }
            ]
          }
        },
        [
          {
            field: "data.plain.value.0.subfield1.value",
            message: "This must be entered in the form: MM-DD-YYYY"
          }
        ]
      );
    });
  });
});
