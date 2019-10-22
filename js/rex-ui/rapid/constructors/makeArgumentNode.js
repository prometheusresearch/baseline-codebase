import { type IntrospectionInputValue } from "graphql/type/introspection";
import { type ArgumentNode } from "graphql/language/ast";

export const makeArgumentNode = (
  inputValue: IntrospectionInputValue,
  inputValueCallback: (inputValue: IntrospectionInputValue) => void
): ArgumentNode => {
  const { name: inputValueName, type: _inputValueType } = inputValue;
  const inputValueType: TIntrospectionFieldType = (_inputValueType: any);

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
