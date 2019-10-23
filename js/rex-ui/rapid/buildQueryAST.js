/**
 * @flow
 */

import invariant from "invariant";
import {
  type IntrospectionSchema,
  type IntrospectionType,
  type IntrospectionObjectType,
  type IntrospectionField,
  type IntrospectionInputValue
} from "graphql/utilities/introspectionQuery";

import {
  type ASTNode,
  type SelectionSetNode,
  type ArgumentNode
} from "graphql/language/ast";
import { buildVariableDefinition } from "./buildVariableDefinition";
import { buildArgumentNode } from "./buildArgumentNode";

export type TypeIntrospectionFieldType = {|
  kind: string,
  name: ?string,
  ofType: ?TypeIntrospectionFieldType
|};

export type TypeIntrospectionTypesMap = { [key: string]: IntrospectionType };

export type TypeSchemaDataObject = {|
  schema: IntrospectionSchema,
  typesMap: Map<string, IntrospectionType>
|};

const getBaseTypeFromRoot = (
  typesMap: Map<string, IntrospectionType>,
  rootType: IntrospectionObjectType,
  base: string
): IntrospectionType => {
  const field = rootType.fields.find(f => f.name === base);

  invariant(field, `No field "${base}" found in getBaseTypeFromRoot`);

  const { name, type } = field;
  const { kind, ofType } = (type: any);

  invariant(ofType != null, "ofType is null");
  invariant(ofType.kind != null, "ofType.kind is null");
  invariant(ofType.name != null, "ofType.name is null");

  const baseType = typesMap.get(ofType.name);

  invariant(baseType != null, "baseType is null");

  return baseType;
};

const buildSelectionSet = (
  typesMap: Map<string, IntrospectionType>,
  {
    fieldName,
    fieldArguments,
    currType,
    path,
    collectInputValues
  }: {
    fieldName: string,
    fieldArguments: ArgumentNode[],
    currType: IntrospectionObjectType,
    path: string[],
    collectInputValues: (inputValue: IntrospectionInputValue) => void
  }
): SelectionSetNode => {
  if (path.length === 0) {
    return {
      kind: "SelectionSet",
      selections: [
        {
          arguments: fieldArguments || [],
          directives: [],
          kind: "Field",
          name: { kind: "Name", value: fieldName },

          selectionSet: {
            kind: "SelectionSet",
            selections: currType.fields.map(f => {
              return {
                arguments: f.args.map(arg =>
                  buildArgumentNode(arg, collectInputValues)
                ),
                directives: [],
                kind: "Field",
                name: { kind: "Name", value: f.name }
              };
            })
          }
        }
      ]
    };
  }

  const [nextFieldName, ...restPath] = path;

  const nextField = currType.fields.find(f => f.name === nextFieldName);
  invariant(nextField != null, `nextField for "${nextFieldName}" is null`);

  const _typeForNextField = ((
    typesMap: Map<string, IntrospectionType>,
    field: IntrospectionField
  ) => {
    let { type }: { type: TypeIntrospectionFieldType } = (field: any);

    let nextTypeName: string;

    if (type.kind && type.name) {
      nextTypeName = type.name;
    }

    if (type.kind && !type.name) {
      const { ofType } = type;

      invariant(ofType != null, "ofType is null when type.name is also null");
      invariant(
        ofType.kind != null,
        "ofType.kind is null when type.name is also null"
      );
      invariant(
        ofType.name != null,
        "ofType.name is null when type.name is also null"
      );

      nextTypeName = ofType.name;
    }

    invariant(nextTypeName != null, "nextTypeName is null");

    return typesMap.get(nextTypeName);
  })(typesMap, nextField);

  invariant(_typeForNextField != null, "_nextType is null");

  const typeForNextField: IntrospectionObjectType = (_typeForNextField: any);

  return {
    kind: "SelectionSet",
    selections: [
      {
        arguments: fieldArguments || [],
        directives: [],
        kind: "Field",
        name: { kind: "Name", value: fieldName },

        selectionSet: buildSelectionSet(typesMap, {
          fieldName: nextFieldName,
          fieldArguments: nextField.args.map(arg =>
            buildArgumentNode(arg, collectInputValues)
          ),
          currType: typeForNextField,
          path: restPath,
          collectInputValues
        })
      }
    ]
  };
};

export const buildQueryAST = (props: {
  schema: IntrospectionSchema,
  path: Array<string>
}): ASTNode => {
  invariant(props != null, "props is null");

  const { schema, path } = props;

  invariant(schema != null, "schema is null");
  invariant(path != null, "path is null");

  const introspectionTypes: $ReadOnlyArray<IntrospectionType> = schema.types;

  let typesMap = new Map();
  for (let t of introspectionTypes) {
    typesMap.set(t.name, t);
  }

  let _rootType: IntrospectionType | typeof undefined = typesMap.get(
    schema.queryType.name
  );
  let rootType: IntrospectionObjectType = (_rootType: any);

  invariant(rootType != null, "rootType is null | undefined");

  let [fieldName, ...restPath] = path;

  // rootType -> fields -> fieldName
  const baseType: IntrospectionObjectType = (getBaseTypeFromRoot(
    typesMap,
    rootType,
    fieldName
  ): any);
  invariant(baseType != null, "baseType is null");

  const inputValues: IntrospectionInputValue[] = [];
  const collectInputValues = (inputValue: IntrospectionInputValue) => {
    inputValues.push(inputValue);
  };

  const operationDefinition = {
    directives: [],
    kind: "OperationDefinition",
    name: { kind: "Name", value: "ConstructedQuery" },
    operation: "query",
    selectionSet: buildSelectionSet(typesMap, {
      fieldName,
      fieldArguments: [],
      currType: baseType,
      path: restPath,
      collectInputValues
    }),
    variableDefinitions: inputValues.map(buildVariableDefinition)
  };

  return {
    kind: "Document",
    definitions: [operationDefinition]
  };
};
