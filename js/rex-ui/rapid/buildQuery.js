/**
 * @flow
 */
import { type AbstractComponent } from "react";
import invariant from "invariant";
import * as introspection from "graphql/utilities/introspectionQuery";
import * as ast from "graphql/language/ast";
import { print } from "graphql/language/printer";

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

type QueryFieldSpec = {
  title?: string,
  field: string,
  require?: QueryFieldSpec[]
};

/** Configure visual fields (columns in a table, fields in a card) */
export type FieldConfig =
  | string // 'some' is the same as {require: ['some']}
  | FieldSpec;

export type FieldSpec = {
  /**
   * TODO: Maybe change to prevent things like:
   * "specName.require.require" -> "specName.subfields.require"
   */
  require: QueryFieldSpec,
  render?: AbstractComponent<{ value: any }>,
  width?: number
};

export const makeConfigToSpec = (nodes: FieldConfig[] = []): FieldSpec[] => {
  return nodes.map(node => {
    switch (typeof node) {
      case "string": {
        return {
          require: {
            field: node,
            require: []
          }
        };
      }

      default: {
        const { render, require } = node;
        return {
          require,
          render
        };
      }
    }
  });
};

/** Configure fields to fetch from GraphQL endpoint. */
export const buildQuery = ({
  schema,
  path,
  fields
}: {|
  schema: introspection.IntrospectionSchema,
  path: Array<string>,
  fields?: void | Array<FieldConfig>
|}): {|
  query: string,
  ast: ast.DocumentNode,
  columns: ast.FieldNode[],
  introspectionTypesMap: Map<string, introspection.IntrospectionType>,
  queryDefinition: ast.OperationDefinitionNode,
  fieldSpecs: FieldSpec[]
|} => {
  const fieldSpecs = makeConfigToSpec(fields);

  const {
    ast,
    columns,
    queryDefinition,
    introspectionTypesMap
  } = buildQueryAST(schema, path, fieldSpecs);
  const query = print(ast);
  return {
    query,
    ast,
    columns,
    queryDefinition,
    introspectionTypesMap,
    fieldSpecs
  };
};

const buildQueryAST = (
  schema: introspection.IntrospectionSchema,
  path: Array<string>,
  userRequiredFields?: FieldSpec[]
): {|
  ast: ast.DocumentNode,
  columns: ast.FieldNode[],
  introspectionTypesMap: Map<string, introspection.IntrospectionType>,
  queryDefinition: ast.OperationDefinitionNode
|} => {
  let typesMap: Map<string, introspection.IntrospectionType> = new Map();
  for (let t of schema.types) {
    typesMap.set(t.name, t);
  }

  let rootType = typesMap.get(schema.queryType.name);
  invariant(rootType != null, "Expected ObjectType at the root");
  invariant(rootType.kind === "OBJECT", "Expected ObjectType at the root");

  let [selectionSet, columns, inputValues] = buildSelectionSet(
    typesMap,
    rootType,
    path,
    userRequiredFields
  );

  const operationDefinition = {
    directives: [],
    kind: "OperationDefinition",
    name: { kind: "Name", value: "ConstructedQuery" },
    operation: "query",
    selectionSet,
    variableDefinitions: inputValues.map(buildVariableDefinitionNode)
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

const makeSelectionSetFromSpec = (
  fieldSpec?: FieldSpec
): void | ast.SelectionSetNode => {
  if (!fieldSpec) return;

  return {
    kind: "SelectionSet",
    selections: fieldSpec.require.require
      ? fieldSpec.require.require.map(obj => {
          return {
            kind: "Field",
            name: {
              kind: "Name",
              value: obj.field
            }
          };
        })
      : []
  };
};

const buildSelectionSet = (
  typesMap: Map<string, introspection.IntrospectionType>,
  type: introspection.IntrospectionObjectType,
  path: string[],
  userRequiredFields?: FieldSpec[] = []
): [
  ast.SelectionSetNode,
  ast.FieldNode[],
  introspection.IntrospectionInputValue[]
] => {
  // Break the recursion
  if (path.length === 0) {
    let fields = type.fields.filter(
      field =>
        isFieldNodeScalarLike(field) ||
        isFieldNodeObjectLike(field) ||
        isFieldNodeListLike(field)
    );

    // Filtering IntrospectionField[] from userRequiredFields
    if (userRequiredFields && userRequiredFields.length > 0) {
      fields = fields.filter(field => {
        return userRequiredFields.find(fieldSpec => {
          return fieldSpec.require.field === field.name;
        });
      });
    }

    const selections: ast.FieldNode[] = [];
    const inputValues: introspection.IntrospectionInputValue[] = [];

    for (let field of fields) {
      let args = [];
      for (let arg of field.args) {
        args.push(buildArgumentNode(arg));
        inputValues.push(arg);
      }

      const fieldSpec = userRequiredFields.find(
        f => f.require.field === field.name
      );
      invariant(
        fieldSpec != null,
        `Can not find fieldSpec with name ${field.name} in userRequiredFields`
      );

      // TODO: Make it recursive
      const selectionSet = makeSelectionSetFromSpec(fieldSpec);

      selections.push({
        kind: "Field",
        arguments: args,
        directives: [],
        name: { kind: "Name", value: field.name },
        selectionSet
      });
    }

    let selectionSet = {
      kind: "SelectionSet",
      selections
    };

    // console.log("selectionSet: ", selectionSet);

    return [selectionSet, selections, inputValues];
  } else {
    const [fieldName, ...restPath] = path;
    const [field, fieldType] = resolveField(typesMap, type, fieldName);

    const args = [];
    const inputValues = [];
    for (let arg of field.args) {
      args.push(buildArgumentNode(arg));
      inputValues.push(arg);
    }

    const [selectionSet, selections, nextInputValues] = buildSelectionSet(
      typesMap,
      fieldType,
      restPath,
      userRequiredFields
    );

    const ast = {
      kind: "SelectionSet",
      selections: [
        {
          arguments: args,
          directives: [],
          kind: "Field",
          name: { kind: "Name", value: fieldName },
          selectionSet
        }
      ]
    };
    return [ast, selections, inputValues.concat(nextInputValues)];
  }
};

const buildArgumentNode = (
  introInputValue: introspection.IntrospectionInputValue
): ast.ArgumentNode => {
  let name: ast.NameNode = {
    kind: "Name",
    value: introInputValue.name
  };

  let value: ast.ValueNode = {
    kind: "Variable",
    name: {
      kind: "Name",
      value: introInputValue.name
    }
  };

  return {
    kind: "Argument",
    name,
    value
  };
};

const buildVariableDefinitionNode = (
  introInputValue: introspection.IntrospectionInputValue
): ast.VariableDefinitionNode => {
  return {
    kind: "VariableDefinition",
    variable: {
      kind: "Variable",
      name: {
        kind: "Name",
        value: introInputValue.name
      }
    },
    type: buildTypeNode(introInputValue.type)
  };
};

const buildTypeNode = (
  introType: introspection.IntrospectionInputTypeRef
): ast.TypeNode => {
  switch (introType.kind) {
    case "NON_NULL": {
      let type = buildTypeNode(introType.ofType);
      invariant(
        type.kind === "ListType" || type.kind === "NamedType",
        "Nested NonNullType is not possible"
      );
      return {
        kind: "NonNullType",
        type
      };
    }
    case "LIST": {
      return {
        kind: "ListType",
        type: buildTypeNode(introType.ofType)
      };
    }
    case "INPUT_OBJECT":
      return {
        kind: "NamedType",
        name: { kind: "Name", value: introType.name }
      };
    case "ENUM":
      return {
        kind: "NamedType",
        name: { kind: "Name", value: introType.name }
      };
    case "SCALAR":
      return {
        kind: "NamedType",
        name: { kind: "Name", value: introType.name }
      };
    default:
      (introType.kind: empty);
      invariant(false, `Unknown GraphQL introspection type: ${introType.kind}`);
  }
};

function isFieldNodeScalarLike(field) {
  return (
    field.type.kind === "SCALAR" ||
    (field.type.kind === "NON_NULL" && field.type.ofType.kind === "SCALAR")
  );
}

function isFieldNodeObjectLike(field) {
  return (
    field.type.kind === "OBJECT" ||
    (field.type.kind === "NON_NULL" && field.type.ofType.kind === "OBJECT")
  );
}

function isFieldNodeListLike(field) {
  return (
    field.type.kind === "LIST" ||
    (field.type.kind === "NON_NULL" && field.type.ofType.kind === "LIST")
  );
}

const resolveField = (
  typesMap: Map<string, introspection.IntrospectionType>,
  type: introspection.IntrospectionObjectType,
  fieldName: string
): [
  introspection.IntrospectionField,
  introspection.IntrospectionObjectType
] => {
  const field = type.fields.find(f => f.name === fieldName);
  invariant(field, `No field "${type.name}.${fieldName}" found`);

  function resolveType(typeRef) {
    let nextType;
    switch (typeRef.kind) {
      case "NON_NULL":
        nextType = resolveType(typeRef.ofType);
        break;
      case "LIST":
        nextType = resolveType(typeRef.ofType);
        break;
      case "ENUM":
        nextType = typesMap.get(typeRef.name);
        break;
      case "SCALAR":
        break;
      case "UNION":
        nextType = typesMap.get(typeRef.name);
        break;
      case "INTERFACE":
        nextType = typesMap.get(typeRef.name);
        break;
      case "OBJECT":
        nextType = typesMap.get(typeRef.name);
        break;
      default:
        (typeRef.kind: empty);
        invariant(false, "Impossible");
    }
    invariant(
      nextType != null,
      `No type for field "${type.name}.${fieldName}" found`
    );
    return nextType;
  }

  let nextType = resolveType(field.type);
  invariant(nextType.kind === "OBJECT", "Expected object type");
  return [field, nextType];
};
