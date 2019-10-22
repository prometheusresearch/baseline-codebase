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

import { type ASTNode, type SelectionSetNode } from "graphql/language/ast";

type TIntrospectionFieldType = {|
  kind: string,
  name: ?string,
  ofType: ?TIntrospectionFieldType
|};

type TIntrospectionTypesMap = { [key: string]: IntrospectionType };

type TSchemaDataObject = {|
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

const buildQuery = (
  typesMap: Map<string, IntrospectionType>,
  {
    fieldName,
    type,
    path
  }: {
    fieldName: string,
    type: IntrospectionObjectType,
    path: string[]
  }
): SelectionSetNode => {
  if (path.length === 0) {
    return {
      kind: "SelectionSet",
      selections: [
        {
          arguments: [],
          directives: [],
          kind: "Field",
          name: { kind: "Name", value: fieldName },
          selectionSet: {
            kind: "SelectionSet",
            selections: type.fields.map(f => {
              return {
                arguments: [],
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
  const nextField = type.fields.find(f => f.name === nextFieldName);

  invariant(nextField != null, `nextField for "${nextFieldName}" is null`);

  const _nextType = ((
    typesMap: Map<string, IntrospectionType>,
    field: IntrospectionField
  ) => {
    let { type }: { type: TIntrospectionFieldType } = (field: any);

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

  invariant(_nextType != null, "_nextType is null");

  const nextType: IntrospectionObjectType = (_nextType: any);

  return {
    kind: "SelectionSet",
    selections: [
      {
        arguments: [],
        directives: [],
        kind: "Field",
        name: { kind: "Name", value: fieldName },

        selectionSet: buildQuery(typesMap, {
          fieldName: nextFieldName,
          type: nextType,
          path: restPath
        })
      }
    ]
  };
};

export const constructQueryAST = (props: {
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

  let baseType: IntrospectionObjectType = (getBaseTypeFromRoot(
    typesMap,
    rootType,
    fieldName
  ): any);

  invariant(baseType != null, "baseType is null");

  const operationDefinition = {
    directives: [],
    kind: "OperationDefinition",
    name: { kind: "Name", value: "ConstructedQuery" },
    operation: "query",
    selectionSet: buildQuery(typesMap, {
      fieldName,
      type: baseType,
      path: restPath
    }),
    variableDefinitions: []
  };

  return {
    kind: "Document",
    definitions: [operationDefinition]
  };
};
