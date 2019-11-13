/**
 * @flow
 */

import * as React from "react";
import invariant from "invariant";
import { type VariableDefinitionNode } from "graphql/language/ast";
import {
  type IntrospectionType,
  type IntrospectionInputObjectType,
  type IntrospectionInputValue,
  type IntrospectionEnumType
} from "graphql/utilities/introspectionQuery";
import * as Field from "./Field";

const buildSortableFieldObjects = ({
  inputFields,
  fieldObjectExtensions,
  introspectionTypesMap,
  columns,
  sortableColumns
}: {|
  inputFields: $ReadOnlyArray<IntrospectionInputValue>,
  fieldObjectExtensions: Array<{ [key: string]: any }>,
  introspectionTypesMap: Map<string, IntrospectionType>,
  columns: Field.FieldSpec[],
  sortableColumns?: string[]
|}) => {
  const sortFieldsField = inputFields.find(
    inputField => inputField.name === "field" && inputField.type.kind === "ENUM"
  );

  invariant(sortFieldsField != null, "Could not find 'field' input field");

  const enumType: IntrospectionEnumType = (sortFieldsField.type: any);
  const sortFieldsFieldType: IntrospectionEnumType = (introspectionTypesMap.get(
    enumType.name
  ): any);

  invariant(sortFieldsFieldType != null, "Could not find sortFieldsFieldType");

  const sortableFieldNames = sortFieldsFieldType.enumValues.map(
    val => val.name
  );

  let sortableFieldObjects = [];
  sortableFieldNames
    .filter(name => columns.find(col => col.require.field === name))
    .forEach(field => {
      if (sortableColumns != null && !sortableColumns.includes(field)) {
        return;
      }
      fieldObjectExtensions.forEach(fieldObjectExtension => {
        sortableFieldObjects.push({ field, ...fieldObjectExtension });
      });
    });

  return sortableFieldObjects;
};

export const buildSortingConfig = ({
  variableDefinitions,
  introspectionTypesMap,
  variableDefinitionName,
  columns,
  sortableColumns
}: {|
  variableDefinitions?: $ReadOnlyArray<VariableDefinitionNode>,
  introspectionTypesMap: Map<string, IntrospectionType>,
  variableDefinitionName: string,
  columns: Field.FieldSpec[],
  sortableColumns?: string[]
|}): Array<{| field: string, desc: boolean |}> => {
  if (!variableDefinitions) {
    return [];
  }

  const variableDefinition = variableDefinitions.find(def => {
    return def.variable.name.value === variableDefinitionName;
  });

  if (variableDefinition == null) {
    return [];
  }

  invariant(
    variableDefinition.type.name != null,
    "Not a NamedTypeNode. variableDefinition.type.name is null."
  );
  invariant(
    variableDefinition.type.name.value != null,
    "variableDefinition.type.name.value is null."
  );

  const definitionTypeName = (variableDefinition.type.name.value: any);
  const variableType = introspectionTypesMap.get(definitionTypeName);

  invariant(
    variableType != null,
    `Could not get variableType for: ${definitionTypeName}`
  );

  const inputObjectType: IntrospectionInputObjectType = (variableType: any);
  const { inputFields } = inputObjectType;

  const hasValidFields =
    inputFields.find(f => f.name === "field") &&
    inputFields.find(f => f.name === "desc")
      ? true
      : false;

  invariant(
    hasValidFields === true,
    "Not valid inputFields of inputObjectType"
  );

  const sortableFieldObjects = buildSortableFieldObjects({
    inputFields,
    columns,
    fieldObjectExtensions: [{ desc: true }, { desc: false }],
    introspectionTypesMap,
    sortableColumns
  });

  return sortableFieldObjects;
};
