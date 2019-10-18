/**
 * @flow
 */

import invariant from "invariant";
import {
  type IntrospectionSchema,
  type IntrospectionType,
  type IntrospectionObjectType,
  type IntrospectionField
} from "graphql/utilities/introspectionQuery";

import {
  type ASTNode,
  type DefinitionNode,
  type SelectionSetNode,
  type SelectionNode,
  type VariableDefinitionNode
} from "graphql/language/ast";

type TSchemaDataObject = {|
  schema: IntrospectionSchema,
  rootType: IntrospectionType,
  objectTypesMap: TObjectTypesMap
|};

const getNextCursor = (
  data: TSchemaDataObject,
  cursor: IntrospectionField,
  field: string
): IntrospectionField | typeof undefined => {
  const { schema, rootType, objectTypesMap } = data;

  // const cursorFields = cursor.fields;
};

const traverseToPath = (
  data: TSchemaDataObject,
  path: Array<string>
): IntrospectionField | typeof undefined => {
  const { schema, rootType, objectTypesMap } = data;

  let traverseBase: IntrospectionObjectType | typeof undefined;
  let cursor: IntrospectionField | typeof undefined;

  path.forEach((field: string, index: number) => {
    const rootObjectType: IntrospectionObjectType = (rootType: any);

    if (index === 0) {
      let kek = rootObjectType.fields.find(f => f.name === field);

      if (kek) {
        const kekType = kek.type;
        traverseBase =
          kekType.kind === "NON_NULL" &&
          kekType.ofType &&
          kekType.ofType.kind === "OBJECT" &&
          kekType.ofType.name
            ? objectTypesMap[kekType.ofType.name]
            : undefined;
      }
    }

    if (cursor != null) {
      cursor = getNextCursor(data, cursor, field);
      return;
    }
  });

  if (cursor != null) {
    return cursor;
  }

  if (traverseBase != null) {
    return traverseBase;
  }

  return undefined;
};

const getSelectionFieldFromSchema = (
  data: TSchemaDataObject,
  currPath: Array<string>,
  path: Array<string>
): IntrospectionField | typeof undefined => {
  return traverseToPath(data, currPath);
};

export type TObjectTypesMap = { [key: string]: IntrospectionObjectType };

// const getAllSelections = (
//   data: TSchemaDataObject,
//   path: Array<string>,
// ): Array<SelectionNode> => {
// }

const getSelection = (
  data: TSchemaDataObject,
  currPath: Array<string>,
  path: Array<string>
): SelectionNode => {
  const currObject = traverseToPath(data, currPath);

  invariant(currObject, `Can not traverse to ${currPath.join(".")}`);

  const currFieldName = currPath[currPath.length - 1];
  const updatedCurrPath =
    path.length !== 0 ? [...currPath, path.shift()] : currPath;

  return {
    arguments: [],
    directives: [],
    kind: "Field",
    name: { kind: "Name", value: currFieldName },
    selectionSet: getSelectionSet(data, updatedCurrPath, path)
  };
};

const getSelectionArray = (
  data: TSchemaDataObject,
  currPath: Array<string>,
  path: Array<string>
): Array<SelectionNode> => {
  return [getSelection(data, currPath, path)];
};

const getSelectionSet = (
  data: TSchemaDataObject,
  currPath: Array<string>,
  path: Array<string>
): SelectionSetNode => {
  return {
    kind: "SelectionSet",
    selections: path.length === 0 ? [] : getSelectionArray(data, currPath, path)
  };
};

const getOperationDefinition = (
  data: TSchemaDataObject,
  path: Array<string>
): DefinitionNode => {
  const currPath = [path.shift()];

  return {
    directives: [],
    kind: "OperationDefinition",
    name: { kind: "Name", value: "ConstructedQuery" },
    operation: "query",
    selectionSet: getSelectionSet(data, currPath, path),
    variableDefinitions: []
  };
};

export const constructQueryAST = ({
  schema,
  path
}: {
  schema: IntrospectionSchema,
  path: Array<string>
}): ASTNode => {
  const introspectionTypes: $ReadOnlyArray<IntrospectionType> = schema.types;

  const rootType:
    | IntrospectionType
    | typeof undefined = introspectionTypes.reduce(
    (value, introspectionType) => {
      if (value) {
        return value;
      }

      if (
        introspectionType.kind === "OBJECT" &&
        introspectionType.name === "Root"
      ) {
        return introspectionType;
      }

      return value;
    },
    undefined
  );

  invariant(rootType != null, "rootType is null | undefined");

  // Array.filter result type somehow can't be recognized by Flow.js
  let objectTypesArr: Array<IntrospectionObjectType> = [];
  introspectionTypes.forEach(t =>
    t.kind === "OBJECT" ? objectTypesArr.push(t) : null
  );

  const objectTypesMap = objectTypesArr.reduce(
    (acc, t: IntrospectionObjectType) => {
      return ({
        ...acc,
        [t.name]: t
      }: TObjectTypesMap);
    },
    ({}: TObjectTypesMap)
  );

  const data: TSchemaDataObject = { schema, rootType, objectTypesMap };

  return {
    kind: "Document",
    definitions: [getOperationDefinition(data, path)]
  };
};
