/**
 * @flow
 */
import {
  type ArgumentNode,
  type NameNode,
  type ValueNode
} from "graphql/language/ast";
import { type IntrospectionInputValue } from "graphql/utilities/introspectionQuery";

import { type TypeIntrospectionFieldType } from "./buildQueryAST";

export const buildArgumentNode = (
  inputValue: IntrospectionInputValue,
  inputValueCallback: (inputValue: IntrospectionInputValue) => void
): ArgumentNode => {
  const { name: inputValueName, type: _inputValueType } = inputValue;
  const inputValueType: TypeIntrospectionFieldType = (_inputValueType: any);

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
