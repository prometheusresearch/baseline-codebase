/**
 * @flow
 */

import type {
  QueryNavigation,
  Expression,
  BinaryExpression
} from "../../model/types";

import * as React from "react";
import invariant from "invariant";

import * as q from "../../model/Query";
import * as operands from "./FilterOperands";

function isOfType(field: QueryNavigation, types: Array<string>): boolean {
  let type = field.context.type;
  return types.includes(type.name);
}

export type Identification = {
  // The name of the field being examined
  field: string,

  // Whether or not the operand is a field or a literal value
  operandIsField: boolean,

  // The operand being compared to
  operand: ?any
};

export type FullIdentification = Identification & {
  // The unqiue ID of the comparator that identified the expression
  comparator: string
};

export type Comparator = {
  // The name shown to the user
  label: string,
  // The unique ID of the comparator
  value: string,

  labelActive?: string,

  // A function that looks at a query to determine if it is one that this
  // comparator handles. If so, it returns an object containing basic info.
  identify(expression: Expression): ?Identification,

  // A function that looks at a field and dermines if it is one that this
  // comparator can be used with.
  applicable(field: QueryNavigation): boolean,

  // A function that returns a React element that can collect the operand for
  // this comparator. If no operand is necessary, return null.
  operand(
    field: QueryNavigation,
    value: ?any,
    onChange: (operand: ?any) => void
  ): ?React.Node,

  // A function that generates a Query for the given field and operand. If a
  // legal Query cannot be generated, return null.
  query(
    field: QueryNavigation,
    operand: ?any,
    operandIsField: ?boolean
  ): ?Expression
};

class BasicBinaryComparator {
  label: string;
  value: string;
  types: Array<string>;

  applicable(field) {
    let type = field.context.type;
    return type.card !== "seq" && isOfType(field, this.types);
  }

  checkQuery(_query: BinaryExpression): boolean {
    return true;
  }

  identify(query: Expression): ?Identification {
    if (query.name !== "binary") {
      return null;
    }
    const { left, right } = query;
    if (query.op !== this.value) {
      return null;
    }
    if (left.name !== "navigate") {
      return null;
    }
    if (!(right.name === "navigate" || right.name === "value")) {
      return null;
    }
    if (!this.checkQuery(query)) {
      return null;
    }
    return {
      field: left.path,
      operand: right.name === "navigate" ? right.path : right.value,
      operandIsField: right.name === "navigate"
    };
  }

  operand(field, value, onChange) {
    let props = { value, onChange };
    let Component;
    let type = field.context.type;
    if (type.name === "invalid") {
      // XXX: Better to throw?
      return null;
    }
    switch (type.name) {
      case "record":
        Component = operands.TextOperand;
        return <Component {...props} />;

      case "text":
        Component = operands.TextOperand;
        return <Component {...props} />;

      case "number":
        Component = operands.NumberOperand;
        return <Component {...props} />;

      case "date":
        Component = operands.DateOperand;
        return <Component {...props} />;

      case "time":
        Component = operands.TimeOperand;
        return <Component {...props} />;

      case "datetime":
        Component = operands.DateTimeOperand;
        return <Component {...props} />;

      case "enumeration":
        Component = operands.EnumerationOperand;
        props = {
          ...props,
          options: type.enumerations.map(enumeration => {
            return {
              label: enumeration,
              value: enumeration
            };
          })
        };
        return <Component {...props} />;

      default:
        invariant(
          false,
          'Cannot generate operand component for "%s"',
          type.name
        );
    }

  }

  query(field, operand, operandIsField) {
    return operand != null
      ? q[this.value](
          q.use(field.value),
          operandIsField ? q.navigate(operand) : q.value(operand)
        )
      : null;
  }
}

function isEqualMultiExpression(expression: BinaryExpression): boolean {
  const { right } = expression;
  if (right.name === "value" && Array.isArray(right.value)) {
    return true;
  } else {
    return false;
  }
}

class Equal extends BasicBinaryComparator {
  label = "is equal";
  value = "equal";
  types = ["text", "number", "date", "time", "datetime", "record"];

  checkQuery(expression: BinaryExpression): boolean {
    return !isEqualMultiExpression(expression);
  }
}

class NotEqual extends BasicBinaryComparator {
  label = "is not equal to";
  value = "notEqual";
  types = ["text", "number", "date", "time", "datetime", "record"];

  checkQuery(expression: BinaryExpression): boolean {
    return !isEqualMultiExpression(expression);
  }
}

class Less extends BasicBinaryComparator {
  label = "is less than";
  value = "less";
  types = ["number", "date", "time", "datetime"];
}

class LessEqual extends BasicBinaryComparator {
  label = "is less than or equal to";
  value = "lessEqual";
  types = ["number", "date", "time", "datetime"];
}

class Greater extends BasicBinaryComparator {
  label = "is greater than";
  value = "greater";
  types = ["number", "date", "time", "datetime"];
}

class GreaterEqual extends BasicBinaryComparator {
  label = "is greater than or equal to";
  value = "greaterEqual";
  types = ["number", "date", "time", "datetime"];
}

class Contains extends BasicBinaryComparator {
  label = "contains";
  value = "contains";
  types = ["text"];
}

class NotContains extends BasicBinaryComparator {
  label = "doesn't contain";
  value = "notContains";
  types = ["text"];

  identify(query: Expression) {
    if (query.name !== "unary") {
      return null;
    }
    if (query.op === "not") {
      const expr = query.expression;
      if (expr.name === "binary") {
        const { left, right } = expr;
        if (
          left.name === "navigate" &&
          (right.name === "navigate" || right.name === "value")
        ) {
          const operand = right.name === "navigate" ? right.path : right.value;
          return {
            field: left.path,
            operand,
            operandIsField: right.name === "navigate"
          };
        }
      }
    }
  }

  query(field, operand, operandIsField) {
    return operand
      ? q.not(
          q.contains(
            q.use(field.value),
            operandIsField ? q.navigate(operand) : operand
          )
        )
      : null;
  }
}

class IsOneOf {
  label = "is one of";
  value = "enumIn";
  op = "equal";

  identify(expression) {
    if (expression.name !== "binary") {
      return null;
    }
    if (expression.op !== this.op) {
      return null;
    }
    if (expression.right.name !== "value") {
      return null;
    }
    if (expression.left.name !== "navigate") {
      return null;
    }

    let field = expression.left.path;
    let operandIsField = false;
    let operand = expression.right.value;
    if (!Array.isArray(operand)) {
      operand = [operand];
    }
    return { field, operand, operandIsField };
  }

  applicable(field) {
    return isOfType(field, ["enumeration"]);
  }

  operand(field, value, onChange) {
    let type = field.context.type;
    invariant(type && type.name === "enumeration", "Incompat type");
    let options = type.enumerations.map(enumeration => {
      return {
        label: enumeration,
        value: enumeration
      };
    });

    return (
      <operands.MultiEnumerationOperand
        options={options}
        value={value}
        onChange={onChange}
      />
    );
  }

  query(field, operand) {
    if (operand && operand.length > 0) {
      return q[this.op](q.use(field.value), q.value(operand));
    }
  }
}

class IsNotOneOf extends IsOneOf {
  label = "is not one of";
  value = "enumNotIn";
  op = "notEqual";
}

class Empty {
  label = "is empty";
  value = "empty";

  identify(expression) {
    if (
      expression.name === "unary" &&
      expression.op === "not" &&
      expression.expression.name === "unary" &&
      expression.expression.op === "exists" &&
      expression.expression.expression.name === "navigate"
    ) {
      return {
        field: expression.expression.expression.path,
        operand: null,
        operandIsField: false
      };
    }
  }

  applicable(field) {
    return (
      isOfType(field, [
        "text",
        "number",
        "enumeration",
        "boolean",
        "date",
        "time",
        "datetime",
        "record"
      ]) && field.context.type.card != null
    );
  }

  operand(field, value, onChange) {
    return null;
  }

  query(field) {
    return q.not(q.exists(q.use(field.value)));
  }
}

class NotEmpty extends Empty {
  label = "is not empty";
  value = "notEmpty";

  identify(expression) {
    if (
      expression.name === "unary" &&
      expression.op === "exists" &&
      expression.expression.name === "navigate"
    ) {
      return {
        field: expression.expression.path,
        operand: null,
        operandIsField: false
      };
    }
  }

  query(field) {
    return q.exists(q.use(field.value));
  }
}

class IsTrue {
  label = "is true";
  value = "isTrue";

  applicable(field) {
    return isOfType(field, ["boolean"]);
  }

  identify(expression: Expression) {
    if (expression.name !== "navigate") {
      return null;
    }
    return {
      field: expression.path,
      operand: null,
      operandIsField: false
    };
  }

  operand(_field, _value, _onChange) {
    return null;
  }

  query(field) {
    return q.use(field.value);
  }
}

class IsFalse {
  label = "is false";
  value = "isFalse";

  applicable(field) {
    return isOfType(field, ["boolean"]);
  }

  identify(expression: Expression) {
    if (expression.name !== "unary") {
      return null;
    }
    if (expression.op !== "not") {
      return null;
    }
    if (expression.expression.name !== "navigate") {
      return null;
    }
    return {
      field: expression.expression.path,
      operand: null,
      operandIsField: false
    };
  }

  operand(_field, _value, _onChange) {
    return null;
  }

  query(field) {
    return q.not(q.use(field.value));
  }
}

const ALL_COMPARATORS = [
  new Equal(),
  new NotEqual(),
  new Less(),
  new LessEqual(),
  new Greater(),
  new GreaterEqual(),
  new Contains(),
  new NotContains(),
  new IsOneOf(),
  new IsNotOneOf(),
  new Empty(),
  new NotEmpty(),
  new IsTrue(),
  new IsFalse()
];

export function identify(expression: Expression): ?FullIdentification {
  for (let i = 0; i < ALL_COMPARATORS.length; i++) {
    let identification = ALL_COMPARATORS[i].identify(expression);
    if (identification) {
      return {
        ...identification,
        comparator: ALL_COMPARATORS[i].value
      };
    }
  }
}

export function getApplicableForField(
  field: QueryNavigation
): Array<Comparator> {
  return ALL_COMPARATORS.filter(comp => {
    return comp.applicable(field);
  });
}

export function getDefinition(
  comparatorName: string,
  comparatorCollection: Array<Comparator> = ALL_COMPARATORS
): ?Comparator {
  for (let i = 0; i < comparatorCollection.length; i++) {
    if (comparatorCollection[i].value === comparatorName) {
      return comparatorCollection[i];
    }
  }
}
