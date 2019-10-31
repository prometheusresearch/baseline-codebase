/**
 * @flow
 */
import invariant from "invariant";
import { type IntrospectionInputValue } from "graphql/utilities/introspectionQuery";
import { type VariableDefinitionNode } from "graphql/language/ast";

import { type TypeIntrospectionFieldType } from "./buildQueryAST";

export const buildVariableDefinition = (
  _inputValue: IntrospectionInputValue
): VariableDefinitionNode => {
  const { name: inputValueName, type: inputValueType } = _inputValue;
  const inputValue: TypeIntrospectionFieldType = (_inputValue: any);

  const { ofType } = (inputValueType: any);

  let kind;
  let name;
  let type;

  switch (inputValueType.kind) {
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

    case "INPUT_OBJECT":
    default: {
      console.log(
        `Getting default VariableDefinitionNode for: `,
        inputValueType
      );
      invariant(inputValueType.name != null, "inputValueTypeName is null");

      kind = "NamedType";
      name = {
        kind: "Name",
        value: inputValueType.name
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
        value: inputValueName
      }
    },
    // TODO: Fix this 'any' \(U_U)/
    type: (variableDefinitionType: any)
  };
};
