/**
 * @flow
 */

import invariant from "invariant";
import * as introspection from "graphql/utilities/introspectionQuery";
import * as ast from "graphql/language/ast";
import { print } from "graphql/language/printer";

import { buildVariableDefinition } from "./buildVariableDefinition";
import { buildArgumentNode } from "./buildArgumentNode";

export type TypeIntrospectionFieldType = {|
  kind: string,
  name: ?string,
  ofType: ?TypeIntrospectionFieldType
|};

export type TypeIntrospectionTypesMap = {
  [key: string]: introspection.IntrospectionType
};

export type TypeSchemaDataObject = {|
  schema: introspection.IntrospectionSchema,
  typesMap: Map<string, introspection.IntrospectionType>
|};

export const buildQuery = ({
  schema,
  path
}: {
  schema: introspection.IntrospectionSchema,
  path: Array<string>
}): {|
  query: string,
  ast: ast.DocumentNode,
  columns: ast.FieldNode[],
  introspectionTypesMap: Map<string, introspection.IntrospectionType>,
  queryDefinition: ast.OperationDefinitionNode
|} => {
  const {
    ast,
    columns,
    queryDefinition,
    introspectionTypesMap
  } = buildQueryAST({ schema, path });
  const query = print(ast);
  return {
    query,
    ast,
    columns,
    queryDefinition,
    introspectionTypesMap
  };
};

const buildQueryAST = (props: {
  schema: introspection.IntrospectionSchema,
  path: Array<string>
}): {|
  ast: ast.DocumentNode,
  columns: ast.FieldNode[],
  introspectionTypesMap: Map<string, introspection.IntrospectionType>,
  queryDefinition: ast.OperationDefinitionNode
|} => {
  invariant(props != null, "props is null");

  const { schema, path } = props;

  invariant(schema != null, "schema is null");
  invariant(path != null, "path is null");

  const introspectionTypes: $ReadOnlyArray<introspection.IntrospectionType> =
    schema.types;

  let typesMap = new Map();
  for (let t of introspectionTypes) {
    typesMap.set(t.name, t);
  }

  let _rootType:
    | introspection.IntrospectionType
    | typeof undefined = typesMap.get(schema.queryType.name);
  let rootType: introspection.IntrospectionObjectType = (_rootType: any);

  invariant(rootType != null, "rootType is null | undefined");

  let [fieldName, ...restPath] = path;

  // rootType -> fields -> fieldName
  const baseType: introspection.IntrospectionObjectType = (getBaseTypeFromRoot(
    typesMap,
    rootType,
    fieldName
  ): any);

  invariant(baseType != null, "baseType is null");

  const inputValues: introspection.IntrospectionInputValue[] = [];
  const collectInputValues = (
    inputValue: introspection.IntrospectionInputValue
  ) => {
    inputValues.push(inputValue);
  };

  let columns: ast.FieldNode[] = [];
  const collectColumns = (selections: ast.FieldNode[]) => {
    columns = selections;
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
      collectInputValues,
      collectColumns
    }),
    variableDefinitions: inputValues.map(buildVariableDefinition)
  };

  return {
    ast: {
      kind: "Document",
      definitions: [operationDefinition]
    },
    columns,
    introspectionTypesMap: typesMap,
    queryDefinition: operationDefinition
  };
};

const getBaseTypeFromRoot = (
  typesMap: Map<string, introspection.IntrospectionType>,
  rootType: introspection.IntrospectionObjectType,
  base: string
): introspection.IntrospectionType => {
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
  typesMap: Map<string, introspection.IntrospectionType>,
  {
    fieldName,
    fieldArguments,
    currType,
    path,
    collectInputValues,
    collectColumns
  }: {
    fieldName: string,
    fieldArguments: ast.ArgumentNode[],
    currType: introspection.IntrospectionObjectType,
    path: string[],
    collectInputValues: (
      inputValue: introspection.IntrospectionInputValue
    ) => void,
    collectColumns: (selections: ast.FieldNode[]) => void
  }
): ast.SelectionSetNode => {
  // Break the recursion
  if (path.length === 0) {
    const selections: ast.FieldNode[] = currType.fields
      .filter(field => {
        // Get only SCALAR or NON_NULL of SCALAR field nodes
        return (
          field.type.kind === "SCALAR" ||
          (field.type.kind === "NON_NULL" &&
            field.type.ofType &&
            field.type.ofType.kind === "SCALAR")
        );
      })
      .map(field => {
        return {
          arguments: field.args.map(arg =>
            buildArgumentNode(arg, collectInputValues)
          ),
          directives: [],
          kind: "Field",
          name: { kind: "Name", value: field.name }
        };
      });

    collectColumns(selections);

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
            selections
          }
        }
      ]
    };
  }

  const [nextFieldName, ...restPath] = path;

  const nextField = currType.fields.find(f => f.name === nextFieldName);
  invariant(nextField != null, `nextField for "${nextFieldName}" is null`);

  // TODO: Move this out from here maybe
  const _typeForNextField = ((
    typesMap: Map<string, introspection.IntrospectionType>,
    field: introspection.IntrospectionField
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

  const typeForNextField: introspection.IntrospectionObjectType = (_typeForNextField: any);

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
          collectInputValues,
          collectColumns
        })
      }
    ]
  };
};
