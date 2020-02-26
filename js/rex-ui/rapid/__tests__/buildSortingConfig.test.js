/**
 * @flow
 */

import {
  buildSortableFieldObjects,
  buildSortingConfig,
  type SortableFieldObjectsInput,
  getInputFieldsFromVariable,
} from "../buildSortingConfig";
import { configureField, configureFields } from "../FieldLegacy.js";
import { buildQueryAST } from "../Introspection";
import * as QueryPath from "../QueryPath";
import * as Field from "../FieldLegacy.js";
import { TEST_SCHEMA } from "./test_schema";

describe("Testing buildSortableFieldObjects function", function() {
  it("Should not has SortableFieldObjects with passed fields", function() {
    let fieldSpecs =
      configureFields({
        remote_user: {
          require: { field: "remote_user" },
        },
        expired: "expired",
        system_admin: {
          require: { field: "system_admin" },
        },
      }) || {};

    let { introspectionTypesMap, queryDefinition } = buildQueryAST(
      TEST_SCHEMA,
      QueryPath.make(["user", "paginated"]),
      fieldSpecs,
    );

    let { variableDefinitions } = queryDefinition;

    let inputFields = getInputFieldsFromVariable(
      queryDefinition.variableDefinitions,
      introspectionTypesMap,
      Field.SORTING_VAR_NAME,
    );

    const sortableFieldObjectsInput: SortableFieldObjectsInput = {
      fieldSpecs,
      inputFields,
      introspectionTypesMap,
    };

    let expectation = buildSortableFieldObjects(sortableFieldObjectsInput);
    expect(expectation).toEqual(null);
  });

  it("Should have SortableFieldObjects with passed fields", function() {
    let fieldSpecs =
      configureFields({
        remote_user: {
          require: { field: "remote_user" },
        },
        expires: "expires",
        system_admin: {
          require: { field: "system_admin" },
        },
      }) || {};

    let { introspectionTypesMap, queryDefinition } = buildQueryAST(
      TEST_SCHEMA,
      QueryPath.make(["user", "paginated"]),
      fieldSpecs,
    );

    let { variableDefinitions } = queryDefinition;

    let inputFields = getInputFieldsFromVariable(
      queryDefinition.variableDefinitions,
      introspectionTypesMap,
      Field.SORTING_VAR_NAME,
    );

    const sortableFieldObjectsInput: SortableFieldObjectsInput = {
      fieldSpecs,
      inputFields,
      introspectionTypesMap,
    };

    let expectation = buildSortableFieldObjects(sortableFieldObjectsInput);
    expect(expectation).toEqual([
      {
        desc: true,
        field: "expires",
      },
      {
        desc: false,
        field: "expires",
      },
    ]);
  });

  it("Should not find inputField.name === 'field' in buildSortableFieldObjects", function() {
    let fieldSpecs =
      configureFields({
        remote_user: {
          require: { field: "remote_user" },
        },
        expires: "expires",
        system_admin: {
          require: { field: "system_admin" },
        },
      }) || {};

    let { introspectionTypesMap, queryDefinition } = buildQueryAST(
      TEST_SCHEMA,
      QueryPath.make(["user", "paginated"]),
      fieldSpecs,
    );

    let { variableDefinitions } = queryDefinition;

    let inputFields = getInputFieldsFromVariable(
      queryDefinition.variableDefinitions,
      introspectionTypesMap,
      Field.SORTING_VAR_NAME,
    );

    const inputFieldsWithNoEnumField = inputFields
      ? inputFields.filter(input => input.name !== "field")
      : [];

    const sortableFieldObjectsInput: SortableFieldObjectsInput = {
      fieldSpecs,
      inputFields: inputFieldsWithNoEnumField,
      introspectionTypesMap,
    };

    let expectation = () =>
      buildSortableFieldObjects(sortableFieldObjectsInput);
    expect(expectation).toThrowError(
      "Could not find inputField.name === 'field' in buildSortableFieldObjects",
    );
  });
});
