/**
 * @flow
 */

import type {Expression} from '../../model';
import type {Navigation} from '../../model/navigation';

import React from 'react';
import invariant from 'invariant';

import * as q from '../../model/Query';
import * as operands from './FilterOperands';

function isOfType(field: Navigation, types: Array<string>): boolean {
  let type = field.context.type;
  return types.includes(type.name);
}

export type Identification = {

  // The name of the field being examined
  field: string;

  // Whether or not the operand is a field or a literal value
  operandIsField: boolean;

  // The operand being compared to
  operand: ?any;
};

export type FullIdentification = Identification & {
  // The unqiue ID of the comparator that identified the expression
  comparator: string;
};

export type Comparator = {
  // The name shown to the user
  label: string;
  // The unique ID of the comparator
  value: string;

  // A function that looks at a query to determine if it is one that this
  // comparator handles. If so, it returns an object containing basic info.
  identify(
    expression: Expression
  ): ?Identification;

  // A function that looks at a field and dermines if it is one that this
  // comparator can be used with.
  applicable(
    field: Navigation
  ): boolean;

  // A function that returns a React element that can collect the operand for
  // this comparator. If no operand is necessary, return null.
  operand(
    field: Navigation,
    value: ?any,
    onChange: (operand: ?any) => void
  ): ?React.Element<*>;

  // A function that generates a Query for the given field and operand. If a
  // legal Query cannot be generated, return null.
  query(
    field: Navigation,
    operand: ?any,
    operandIsField: ?boolean
  ): ?Expression;
};


class BasicBinaryComparator {

  label: string;
  value: string;
  types: Array<string>;

  applicable(field) {
    return isOfType(field, this.types);
  }

  identify(query: Expression): ?Identification {
    if (query.name !== 'binary') {
      return null;
    }
    const {left, right} = query;
    if (query.op !== this.value) {
      return null;
    }
    if (left.name !== 'navigate') {
      return null;
    }
    if (!(right.name === 'navigate' || right.name === 'value')) {
      return null;
    }
    return {
      field: left.path,
      operand: right.name === 'navigate' ? right.path : right.value,
      operandIsField: right.name === 'navigate',
    };
  }

  operand(field, value, onChange) {
    let props = {value, onChange};
    let Component;
    let type = field.context.type;
    if (type.name === 'invalid') {
      // XXX: Better to throw?
      return null;
    }
    switch (type.name) {
      case 'text':
        Component = operands.TextOperand;
        break;

      case 'number':
        Component = operands.NumberOperand;
        break;

      case 'date':
        Component = operands.DateOperand;
        break;

      case 'time':
        Component = operands.TimeOperand;
        break;

      case 'datetime':
        Component = operands.DateTimeOperand;
        break;

      case 'enumeration':
        Component = operands.EnumerationOperand;
        props = {
          ...props,
          options: type.enumerations.map(enumeration => {
            return {
              label: enumeration,
              value: enumeration,
            };
          })
        };
        break;

      default:
        invariant(false, 'Cannot generate operand component for "%s"', type.name);
    }

    return <Component {...props} />
  }

  query(field, operand, operandIsField) {
    return operand
      ? q[this.value](
          q.navigate(field.value),
          operandIsField ? q.navigate(operand) : q.value(operand)
        )
      : null;
  }
}

class Equal extends BasicBinaryComparator {

  label = '==';
  value = 'equal';
  types = ['text', 'number', 'date', 'time', 'datetime'];
}

class NotEqual extends BasicBinaryComparator {

  label = '!=';
  value = 'notEqual';
  types = ['text', 'number', 'date', 'time', 'datetime'];
}

class Less extends BasicBinaryComparator {

  label = '<';
  value = 'less';
  types = ['number', 'date', 'time', 'datetime'];
}

class LessEqual extends BasicBinaryComparator {

  label = '<=';
  value = 'lessEqual';
  types = ['number', 'date', 'time', 'datetime'];
}

class Greater extends BasicBinaryComparator {

  label = '>';
  value = 'greater';
  types = ['number', 'date', 'time', 'datetime'];
}

class GreaterEqual extends BasicBinaryComparator {

  label = '>=';
  value = 'greaterEqual';
  types = ['number', 'date', 'time', 'datetime'];
}

class Contains extends BasicBinaryComparator {

  label = 'contains';
  value = 'contains';
  types = ['text'];
}

class NotContains extends BasicBinaryComparator {

  label = "doesn't contain";
  value = 'notContains';
  types = ['text'];

  identify(query: Expression) {
    if (query.name !== 'unary') {
      return null;
    }
    const expression = query.expression;
    let operandIsField = expression.name === 'binary'
      ? expression.right.name === 'navigate'
      : false;
    if (
        query.name === 'not'
        && expression.name === 'binary'
        && expression.left.name === 'navigate'
        && (expression.right.name === 'navigate' || expression.right.name === 'value')
      ) {

      let field = query.expression.left.path;
      let operand = operandIsField
        ? query.expression.right.path
        : query.expression.right.value;
      return {field, operand, operandIsField};
    }
  }

  query(field, operand, operandIsField) {
    return operand
      ? q.not(q.contains(
          q.navigate(field.value),
          operandIsField ? q.navigate(operand) : operand,
        ))
      : null;
  }
}


class IsOneOf {

  label = '==';
  value = 'enumIn';
  op = 'equal';

  identify(expression) {
    if (expression.name !== 'binary') {
      return null;
    }
    if (expression.op !== this.op) {
      return null;
    }
    if (expression.right.name !== 'value') {
      return null
    }
    if (expression.left.name !== 'navigate') {
      return null
    }

    let field = expression.left.path;
    let operandIsField = false;
    let operand = expression.right.value;
    if (!Array.isArray(operand)) {
      operand = [operand];
    }
    return {field, operand, operandIsField};
  }

  applicable(field) {
    return isOfType(field, ['enumeration']);
  }

  operand(field, value, onChange) {
    let type = field.context.type;
    invariant(
      type && type.name === 'enumeration',
      'Incompat type'
    );
    let options = type.enumerations.map(enumeration => {
      return {
        label: enumeration,
        value: enumeration,
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
    if (operand && (operand.length > 0)) {
      return q[this.op](q.navigate(field.value), operand);
    }
  }
}


class IsNotOneOf extends IsOneOf {
  label = '!=';
  value = 'enumNotIn';
  op = 'notEqual';
}


class Empty {
  label = 'is empty';
  value = 'empty';

  identify(expression) {
    if (
      expression.name === 'not'
      && expression.expression.name === 'exists'
      && expression.expression.expression.name === 'navigate'
    ) {
      return {
        field: expression.expression.expression.path,
        operand: null,
        operandIsField: false,
      };
    }
  }

  applicable(field) {
    return !!(
      isOfType(
        field,
        ['text', 'number', 'enumeration', 'boolean', 'date', 'time', 'datetime']
      ) &&
      field.context.type && field.context.type.card === 'opt'
    );
  }

  operand(field, value, onChange) {
    return null;
  }

  query(field) {
    return q.not(q.exists(q.navigate(field.value)));
  }
}


class NotEmpty extends Empty {
  label = 'is not empty';
  value = 'notEmpty';

  identify(expression) {
    if (
      expression.name === 'exists' &&
      expression.expression.name === 'navigate'
    ) {
      return {
        field: expression.expression.path,
        operand: null,
        operandIsField: false,
      };
    }
  }

  query(field) {
    return q.exists(q.navigate(field.value));
  }
}


class IsTrue {

  label = 'is true';
  value = 'isTrue';

  applicable(field) {
    return isOfType(field, ['boolean']);
  }

  identify(expression: Expression) {
    if (expression.name !== 'navigate') {
      return null;
    }
    return {
      field: expression.path,
      operand: null,
      operandIsField: false,
    };
  }

  operand(_field, _value, _onChange) {
    return null;
  }

  query(field) {
    return q.navigate(field.value);
  }
}


class IsFalse {

  label = 'is false';
  value = 'isFalse';

  applicable(field) {
    return isOfType(field, ['boolean']);
  }

  identify(expression: Expression) {
    if (expression.name !== 'unary') {
      return null;
    }
    if (expression.op !== 'not') {
      return null;
    }
    if (expression.expression.name !== 'navigate') {
      return null;
    }
    return {
      field: expression.expression.path,
      operand: null,
      operandIsField: false,
    };
  }

  operand(_field, _value, _onChange) {
    return null;
  }

  query(field) {
    return q.not(q.navigate(field.value));
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
  new IsFalse(),
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

export function getApplicableForField(field: Navigation): Array<Comparator> {
  return ALL_COMPARATORS.filter((comp) => {
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

