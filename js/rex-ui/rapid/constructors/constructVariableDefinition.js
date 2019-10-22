import { type IntrospectionInputValue } from "graphql/type/introspection";
import { type VariableDefinitionNode } from "graphql/language/ast";

export const constructVariableDefinition = (
  _inputValue: IntrospectionInputValue
): VariableDefinitionNode => {
  const { name: inputValueName, type: inputValueType } = _inputValue;
  const inputValue: TIntrospectionFieldType = (_inputValue: any);

  const {
    name: inputValueTypeName,
    kind: inputValueTypeKind,
    ofType
  } = inputValue;

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
      invariant(inputValueTypeName != null, "inputValueTypeName is null");

      kind = "NamedType";
      name = {
        kind: "Name",
        value: inputValueTypeName
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
