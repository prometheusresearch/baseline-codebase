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
  type IntrospectionEnumType,
} from "graphql/utilities/introspectionQuery";
import * as Field from "./Field";
import { ConfigError } from "./ErrorBoundary";

const buildSortableFieldObjects = ({
  inputFields,
  introspectionTypesMap,
  fieldSpecs,
}: {|
  inputFields: $ReadOnlyArray<IntrospectionInputValue>,
  introspectionTypesMap: Map<string, IntrospectionType>,
  fieldSpecs: { [name: string]: Field.FieldSpec },
|}) => {
  const sortFieldsField = inputFields.find(
    inputField =>
      inputField.name === "field" && inputField.type.kind === "ENUM",
  );

  if (sortFieldsField == null) {
    throw new ConfigError(
      "Could not find 'field' input field in buildSortableFieldObjects",
    );
  }

  const enumType: IntrospectionEnumType = (sortFieldsField.type: any);
  const sortFieldsFieldType: IntrospectionEnumType = (introspectionTypesMap.get(
    enumType.name,
  ): any);

  if (sortFieldsFieldType == null) {
    throw new ConfigError("Could not find sortFieldsFieldType");
  }

  const sortableFieldNames = sortFieldsFieldType.enumValues.map(
    val => val.name,
  );

  let sortableFieldObjects = [];
  for (let name of sortableFieldNames) {
    let spec = fieldSpecs[name];
    if (spec == null || !spec.sortable) {
      continue;
    }
    sortableFieldObjects.push({ field: name, desc: true });
    sortableFieldObjects.push({ field: name, desc: false });
  }

  return sortableFieldObjects.length > 0 ? sortableFieldObjects : null;
};

export const buildSortingConfig = ({
  variableDefinitions,
  introspectionTypesMap,
  fieldSpecs,
  filterSpecs,
}: {|
  variableDefinitions?: $ReadOnlyArray<VariableDefinitionNode>,
  introspectionTypesMap: Map<string, IntrospectionType>,
  fieldSpecs: { [name: string]: Field.FieldSpec },
  filterSpecs: ?Field.FilterSpecMap,
|}): ?Array<{| field: string, desc: boolean |}> => {
  if (variableDefinitions == null) {
    return null;
  }

  const variableDefinition = variableDefinitions.find(def => {
    return def.variable.name.value === Field.SORTING_VAR_NAME;
  });

  if (variableDefinition == null) {
    return null;
  }

  invariant(
    variableDefinition.type.name != null,
    "Not a NamedTypeNode. variableDefinition.type.name is null.",
  );
  invariant(
    variableDefinition.type.name.value != null,
    "variableDefinition.type.name.value is null.",
  );

  const definitionTypeName = (variableDefinition.type.name.value: any);
  const variableType = introspectionTypesMap.get(definitionTypeName);

  if (variableType == null) {
    throw new ConfigError(
      `Could not get variableType for: ${definitionTypeName}`,
    );
  }

  const inputObjectType: IntrospectionInputObjectType = (variableType: any);
  const { inputFields } = inputObjectType;

  const hasValidFields =
    inputFields.find(f => f.name === "field") &&
    inputFields.find(f => f.name === "desc")
      ? true
      : false;

  invariant(
    hasValidFields === true,
    "Not valid inputFields of inputObjectType",
  );

  const sortableFieldObjects = buildSortableFieldObjects({
    inputFields,
    fieldSpecs,
    introspectionTypesMap,
  });

  return sortableFieldObjects;
};
