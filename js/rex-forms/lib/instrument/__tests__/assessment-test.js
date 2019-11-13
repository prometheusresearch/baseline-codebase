// @flow

import type { RIOSInstrument, RIOSValueCollection } from "../../types.js";
import { mapValueCollection } from "../assessment.js";

describe("mapValueCollection", () => {
  let instrument: RIOSInstrument = {
    id: "instrument",
    version: "1.0.9",
    title: "Instrument",
    record: [
      {
        id: "field",
        type: "boolean"
      },
      {
        id: "list",
        type: "myRecordList"
      },
      {
        id: "matrix",
        type: "myMatrix"
      }
    ],
    types: {
      myRecordList: {
        base: "recordList",
        record: [
          {
            id: "list_field",
            type: "boolean"
          }
        ]
      },
      myMatrix: {
        base: "matrix",
        rows: [{ id: "row1" }, { id: "row2" }],
        columns: [
          { id: "col1", type: "boolean" },
          { id: "col2", type: "boolean" }
        ]
      }
    }
  };

  // Going to flip all booleans...
  let seen = new Set();
  let flip = (v, field, type, key) => {
    seen.add(key.join("."));
    return type.base === "boolean" ? !v : v;
  };

  beforeEach(() => {
    seen = new Set();
  });

  it("empty", () => {
    let nextValues = mapValueCollection(instrument, {}, flip);
    expect(nextValues).toEqual({});
    expect(seen).toEqual(new Set([]));
  });

  it("scalar value", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        field: { value: true }
      },
      flip
    );
    expect(nextValues).toEqual({
      field: { value: false }
    });
    expect(seen).toEqual(new Set(["field"]));
  });

  it("empty list", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        field: { value: true },
        list: { value: ([]: RIOSValueCollection[]) }
      },
      flip
    );
    expect(nextValues).toEqual({
      field: { value: false },
      list: { value: [] }
    });
    expect(seen).toEqual(new Set(["field"]));
  });

  it("list with empty value coll", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        field: { value: true },
        list: { value: ([{}]: RIOSValueCollection[]) }
      },
      flip
    );
    expect(nextValues).toEqual({
      field: { value: false },
      list: { value: [{}] }
    });
    expect(seen).toEqual(new Set(["field"]));
  });

  it("list", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        list: {
          value: ([
            { list_field: { value: false } },
            { list_field: { value: true } }
          ]: RIOSValueCollection[])
        }
      },
      flip
    );
    expect(nextValues).toEqual({
      list: {
        value: [
          { list_field: { value: true } },
          { list_field: { value: false } }
        ]
      }
    });
    expect(seen).toEqual(new Set(["list.list_field"]));
  });

  it("empty matrix", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        matrix: { value: {} }
      },
      flip
    );
    expect(nextValues).toEqual({
      matrix: { value: {} }
    });
    expect(seen).toEqual(new Set([]));
  });

  it("matrix with empty row", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        matrix: { value: { row1: {} } }
      },
      flip
    );
    expect(nextValues).toEqual({
      matrix: { value: { row1: {} } }
    });
    expect(seen).toEqual(new Set([]));
  });

  it("matrix with empty col", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        matrix: { value: { row1: { col1: { value: null } } } }
      },
      flip
    );
    expect(nextValues).toEqual({
      matrix: { value: { row1: { col1: { value: null } } } }
    });
    expect(seen).toEqual(new Set([]));
  });

  it("matrix", () => {
    let nextValues = mapValueCollection(
      instrument,
      {
        matrix: {
          value: {
            row1: {
              col1: { value: false },
              col2: { value: true }
            },
            row2: {
              col1: { value: true },
              col2: { value: false }
            }
          }
        }
      },
      flip
    );
    expect(nextValues).toEqual({
      matrix: {
        value: {
          row1: {
            col1: { value: true },
            col2: { value: false }
          },
          row2: {
            col1: { value: false },
            col2: { value: true }
          }
        }
      }
    });
    expect(seen).toEqual(
      new Set([
        "matrix.row1.col1",
        "matrix.row1.col2",
        "matrix.row2.col1",
        "matrix.row2.col2"
      ])
    );
  });
});
