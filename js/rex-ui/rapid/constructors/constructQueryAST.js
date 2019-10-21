/**
 * @flow
 */

import invariant from "invariant";
import {
  type IntrospectionSchema,
  type IntrospectionType,
  type IntrospectionObjectType,
  type IntrospectionField,
  type IntrospectionOutputTypeRef,
  type IntrospectionInputValue
} from "graphql/utilities/introspectionQuery";

import {
  type ASTNode,
  type DefinitionNode,
  type SelectionSetNode,
  type SelectionNode,
  type VariableDefinitionNode,
  type FieldNode,
  type ArgumentNode,
  type ValueNode,
  type NameNode,
  type TypeNode
} from "graphql/language/ast";

type TIntrospectionFieldType = {|
  kind: string,
  name: ?string,
  ofType: ?TIntrospectionFieldType
|};

type TIntrospectionTypesMap = { [key: string]: IntrospectionType };

type TSchemaDataObjectBase = {|
  schema: IntrospectionSchema,
  rootType: IntrospectionObjectType,
  typesMap: TIntrospectionTypesMap
|};

type TSchemaDataObject = {|
  ...TSchemaDataObjectBase,
  inputValueCallback: (inputValue: IntrospectionInputValue) => void
|};

const getBaseIntrospectionTypeFromRoot = (
  data: TSchemaDataObject,
  base: string
): IntrospectionField => {
  const { rootType, schema, typesMap } = data;
  const baseIntrospectionField = rootType.fields.find(f => f.name === base);

  invariant(
    baseIntrospectionField,
    "No baseIntrospectionField found in getBaseIntrospectionTypeFromRoot"
  );

  return baseIntrospectionField;
};

const getBaseTypeFromRoot = (
  data: TSchemaDataObject,
  base: string
): IntrospectionType => {
  const { rootType, schema, typesMap } = data;
  const baseIntrospectionField = rootType.fields.find(f => f.name === base);

  invariant(
    baseIntrospectionField,
    "No baseIntrospectionField found in getBaseTypeFromRoot"
  );

  const { name, type } = baseIntrospectionField;
  const { kind, ofType } = (type: any);

  invariant(ofType != null, "ofType is null");
  invariant(ofType.kind != null, "ofType.kind is null");
  invariant(ofType.name != null, "ofType.name is null");

  return typesMap[ofType.name];
};

const traverseFromBase = (
  data: TSchemaDataObject,
  pathBaseType: IntrospectionType,
  path: string[]
): IntrospectionField | typeof undefined => {
  const { typesMap } = data;

  let currIntrospectionType:
    | IntrospectionType
    | typeof undefined = pathBaseType;

  let currIntrospectionField: IntrospectionField | typeof undefined;

  path.forEach((fieldStr: string) => {
    invariant(
      currIntrospectionType != null,
      "currIntrospectionType somehow is null"
    );
    const { kind, name } = currIntrospectionType;

    switch (kind) {
      case "OBJECT": {
        const castedCurrIntrospectionType: IntrospectionObjectType = (currIntrospectionType: any);

        // Search for IntrospectionField in IntrospectionObjectType.fields
        currIntrospectionField = castedCurrIntrospectionType.fields.find(
          f => f.name === fieldStr
        );

        // Nullify them both if none found
        if (currIntrospectionField == null) {
          currIntrospectionType = undefined;
        } else {
          currIntrospectionType = typesMap[currIntrospectionField.name];
        }
      }

      default: {
      }
    }
  });

  return currIntrospectionField;
};

const traverseToPath = (
  data: TSchemaDataObject,
  path: Array<string>
): IntrospectionField | typeof undefined => {
  const { schema, rootType, typesMap } = data;

  const rootObjectType: IntrospectionObjectType = (rootType: any);

  // "user.some.otherField" => ["user", "some", "otherField"] => "user"
  const [base, ...rest] = path;

  const pathBaseType = getBaseTypeFromRoot(data, base);
  const pathBaseIntrospectionField = getBaseIntrospectionTypeFromRoot(
    data,
    base
  );

  if (rest.length === 0) {
    return pathBaseIntrospectionField;
  }

  invariant(pathBaseType != null, "pathRootObjectType is null");
  invariant(
    pathBaseIntrospectionField != null,
    "pathBaseIntrospectionField is null"
  );

  const finalIntrospectionField = traverseFromBase(data, pathBaseType, rest);

  return finalIntrospectionField;
};

const collectVariableDefinitionsFromTraverse = () => {};

const getSelectionArrayFromIntrospectionType = (
  data: TSchemaDataObject,
  fields: Array<IntrospectionField>
): Array<FieldNode> => {
  return fields.map(f => {
    return {
      arguments: [],
      kind: "Field",
      name: {
        kind: "Name",
        value: f.name
      }
    };
  });
};

const getSelectionSetForFinal = (
  data: TSchemaDataObject,
  finalIntrospectionField: IntrospectionField
): SelectionSetNode | typeof undefined => {
  const { schema, typesMap } = data;
  const { name, type } = finalIntrospectionField;

  let searchTypeName: string = "";
  const castedType: TIntrospectionFieldType = (type: any);
  const { kind: typeKind, name: typeName, ofType } = castedType;
  searchTypeName = typeName != null ? typeName : searchTypeName;

  if (ofType != null) {
    const castedOfType: TIntrospectionFieldType = (ofType: any);
    const { kind: ofTypeKind, name: ofTypeName } = castedOfType;
    searchTypeName = ofTypeName != null ? ofTypeName : searchTypeName;
  }

  const finalIntrospectionType: IntrospectionType = typesMap[searchTypeName];

  const fields = finalIntrospectionType.fields
    ? finalIntrospectionType.fields
    : [];

  const castedFields: Array<IntrospectionField> = (fields: any);

  invariant(
    finalIntrospectionType.fields != null,
    "finalIntrospectionType.fields are null"
  );

  return {
    kind: "SelectionSet",
    selections: getSelectionArrayFromIntrospectionType(data, castedFields)
  };
};

const introspectionInputValueToArgumentNode = (
  inputValue: IntrospectionInputValue,
  inputValueCallback: (inputValue: IntrospectionInputValue) => void
): ArgumentNode => {
  const { name: inputValueName, type: inputValueType } = inputValue;
  const castedType: TIntrospectionFieldType = (inputValueType: any);

  const {
    kind: castedKind,
    name: castedName,
    ofType: castedOfType
  } = castedType;

  let name: NameNode = { kind: "Name", value: inputValueName };
  let value: ValueNode = {
    kind: "Variable",
    name: {
      kind: "Name",
      value: inputValueName
    }
  };

  // Callback to collect all arguments for query
  inputValueCallback(inputValue);

  return {
    kind: "Argument",
    name,
    value
  };
};

const getArgumentNodeArray = (
  argsInput: Array<IntrospectionInputValue>,
  inputValueCallback: (inputValue: IntrospectionInputValue) => void
): Array<ArgumentNode> => {
  return argsInput.map(input => {
    return introspectionInputValueToArgumentNode(input, inputValueCallback);
  });
};

const getSelectionAndUpdatePaths = (
  data: TSchemaDataObject,
  currPath: Array<string>,
  path: Array<string>
): FieldNode => {
  const { inputValueCallback } = data;
  const updatedCurrPath = [...currPath, path.shift()];

  const traversedIntrospectionField = traverseToPath(data, updatedCurrPath);

  // Get the last array element: ['a', 'b', ... , 'z'] => 'z'
  const currFieldName = updatedCurrPath[updatedCurrPath.length - 1];

  invariant(
    traversedIntrospectionField,
    `Can not traverse to ${String(currPath)}`
  );

  const { args } = traversedIntrospectionField;

  return {
    arguments: getArgumentNodeArray([...args], inputValueCallback),
    directives: [],
    kind: "Field",
    name: { kind: "Name", value: traversedIntrospectionField.name },
    selectionSet:
      path.length === 0
        ? getSelectionSetForFinal(data, traversedIntrospectionField)
        : getSelectionSetRecursively(data, updatedCurrPath, path)
  };
};

const getSelectionArray = (
  data: TSchemaDataObject,
  currPath: Array<string>,
  path: Array<string>
): Array<SelectionNode> => {
  return [getSelectionAndUpdatePaths(data, currPath, path)];
};

const getSelectionSetRecursively = (
  data: TSchemaDataObject,
  currPath: Array<string>,
  path: Array<string>
): SelectionSetNode => {
  return {
    kind: "SelectionSet",
    selections: getSelectionArray(data, currPath, path)
  };
};

const getVariableDefinitionNodeFromInputValue = (
  inputValue: IntrospectionInputValue
): VariableDefinitionNode => {
  const { name: inputValueName, type: inputValueType } = inputValue;
  const castedInputValueType: TIntrospectionFieldType = (inputValueType: any);

  const {
    name: inputValueTypeName,
    kind: inputValueTypeKind,
    ofType
  } = castedInputValueType;

  let kind;
  let name;
  let type;

  switch (inputValueTypeKind) {
    case "NON_NULL": {
      invariant(
        ofType != null,
        "ofType can not be null for NON_NULL inputValueTypeKind"
      );

      invariant(
        ofType.kind,
        "ofType.kind can not be null for NON_NULL inputValueTypeKind"
      );

      invariant(
        ofType.name,
        "ofType.name can not be null for NON_NULL inputValueTypeKind"
      );

      const typeKind = ofType;
      kind = "NonNullType";
      type = {
        kind: "NamedType",
        name: {
          kind: "Name",
          value: ofType.name
        }
      };
      break;
    }
    case "LIST": {
      invariant(
        ofType != null,
        "ofType can not be null for NON_NULL inputValueTypeKind"
      );

      invariant(
        ofType.kind,
        "ofType.kind can not be null for NON_NULL inputValueTypeKind"
      );

      invariant(
        ofType.name,
        "ofType.name can not be null for NON_NULL inputValueTypeKind"
      );

      kind = "ListType";
      type = {
        kind: ofType.kind,
        name: ofType.name
      };
      break;
    }
    default: {
      kind = "NamedType";
      name = {
        kind: "Name",
        value: inputValueTypeName || "FIX_ME"
      };
    }
  }

  const variableDefinitionType = { kind, name, type };

  return {
    kind: "VariableDefinition",
    variable: {
      kind: "Variable",
      name: {
        kind: "Name",
        value: inputValue.name
      }
    },
    // TODO: Fix this 'any' \(U_U)/
    type: (variableDefinitionType: any)
  };
};

const getOperationDefinition = (
  data: TSchemaDataObjectBase,
  path: Array<string>
): DefinitionNode => {
  let inputValues: Array<IntrospectionInputValue> = [];
  const inputValueCallback = (inputValue: IntrospectionInputValue) => {
    inputValues.push(inputValue);
  };

  return {
    directives: [],
    kind: "OperationDefinition",
    name: { kind: "Name", value: "ConstructedQuery" },
    operation: "query",
    selectionSet: getSelectionSetRecursively(
      { ...data, inputValueCallback },
      [],
      path
    ),
    variableDefinitions: inputValues.map(
      getVariableDefinitionNodeFromInputValue
    )
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
    | typeof undefined = introspectionTypes.find(t => {
    return t.kind === "OBJECT" && t.name === "Root";
  });

  const castedRootType: IntrospectionObjectType = (rootType: any);

  invariant(castedRootType != null, "castedRootType is null | undefined");

  const typesMap = introspectionTypes.reduce((acc, t: IntrospectionType) => {
    return ({
      ...acc,
      [t.name]: t
    }: TIntrospectionTypesMap);
  }, ({}: TIntrospectionTypesMap));

  const data: TSchemaDataObjectBase = {
    schema,
    rootType: castedRootType,
    typesMap
  };

  return {
    kind: "Document",
    definitions: [getOperationDefinition(data, [...path])]
  };
};
