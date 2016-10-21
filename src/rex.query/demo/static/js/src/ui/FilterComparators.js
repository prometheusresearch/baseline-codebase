import type {Query} from '../model/Query';
import type {Navigation} from '../model/navigation';

import React from 'react';
import invariant from 'invariant';
import isString from 'lodash/isString';
import isBoolean from 'lodash/isBoolean';
import isFinite from 'lodash/isFinite';
import isNull from 'lodash/isNull';

import * as t from '../model/Type';
import * as q from '../model/Query';
import * as operands from './FilterOperands';


function isType(field: Navigation, types: Array<string>): boolean {
  let atom = t.maybeAtom(field.context.type);
  return (atom != null) && types.includes(atom.name);
}

function isNullable(field: Navigation): boolean {
  return (field.context.type != null) && (field.context.type.name === 'opt');
}

function isField(obj: q.QueryOrLiteral): boolean {
  return q.isQuery(obj) && (obj.name === 'navigate');
}

function isLiteral(obj: any): boolean {
  return isString(obj) || isBoolean(obj) || isFinite(obj) || isNull(obj);
}



export type Identification = {
  field: string;  // The name of the field being examined
  operandIsField: boolean;  // Whether or not the operand is a field or a literal value
  operand: ?any;  // The operand being compared to
};

export type FullIdentification = Identification & {
  comparator: string; // The unqiue ID of the comparator that identified the expression
};

export interface Comparator {
  label: string;  // The name shown to the user
  value: string;  // The unique ID of the comparator

  // A function that looks at a query to determine if it is one that this
  // comparator handles. If so, it returns an object containing basic info.
  identify: (expression: Query) => ?Identification;

  // A function that looks at a field and dermines if it is one that this
  // comparator can be used with.
  applicable: (field: Navigation) => boolean;

  // A function that returns a React element that can collect the operand for
  // this comparator. If no operand is necessary, return null.
  operand: (field: Navigation, value: ?any, onChange: (operand: ?any) => void) => ?ReactClass<*>;

  // A function that generates a Query for the given field and operand. If a
  // legal Query cannot be generated, return null.
  query: (field: Navigation, operand: ?any) => ?Query;
};


class BasicBinaryComparator {
  label: string;
  value: string;
  types: Array<string>;

  applicable(field) {
    return isType(field, this.types);
  }

  identify(expression) {
    let operandIsField = isField(expression.right);
    if (
        (expression.name === this.value)
        && isField(expression.left)
        && (operandIsField || isLiteral(expression.right))
      ) {

      let field = expression.left.path;
      let operand = operandIsField ? expression.right.path : expression.right;
      return {field, operand, operandIsField};
    }
  }

  operand(field, value, onChange) {
    let props = {value, onChange};

    let Component;
    let type = t.atom(field.context.type);
    switch (type.name) {
      case 'text':
        Component = operands.TextOperand;
        break;

      case 'number':
        Component = operands.NumberOperand;
        break;

      case 'enumeration':
        Component = operands.EnumerationOperand;
        props.options = type.enumerations.map((enumeration) => {
          return {
            label: enumeration,
            value: enumeration,
          };
        });
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
          operandIsField ? q.navigate(operand) : operand,
        )
      : null;
  }
}

class Equal extends BasicBinaryComparator {
  label = '==';
  value = 'equal';
  types = ['text', 'number', 'enumeration'];
}

class NotEqual extends BasicBinaryComparator {
  label = '!=';
  value = 'notEqual';
  types = ['text', 'number', 'enumeration'];
}

class Less extends BasicBinaryComparator {
  label = '<';
  value = 'less';
  types = ['number'];
}

class LessEqual extends BasicBinaryComparator {
  label = '<=';
  value = 'lessEqual';
  types = ['number'];
}

class Greater extends BasicBinaryComparator {
  label = '>';
  value = 'greater';
  types = ['number'];
}

class GreaterEqual extends BasicBinaryComparator {
  label = '>=';
  value = 'greaterEqual';
  types = ['number'];
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

  identify(expression) {
    let operandIsField = isField(expression.expression.right);
    if (
        (expression.name === 'not')
        && (expression.expression.name === 'contains')
        && isField(expression.expression.left)
        && (operandIsField || isLiteral(expression.expression.right))
      ) {

      let field = expression.expression.left.path;
      let operand = operandIsField ? expression.expression.right.path : expression.expression.right;

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


class Empty {
  label = 'is empty';
  value = 'empty';

  identify(expression) {
    if (
        (expression.name === 'not')
        && (expression.expression.name === 'exists')
        && isField(expression.expression.expression)
       ) {
      return {
        field: expression.expression.expression.path,
        operand: null,
        operandIsField: false,
      };
    }
  }

  applicable(field) {
    return isType(field, ['text', 'number', 'enumeration', 'boolean'])
      && isNullable(field);
  }

  operand() {
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
        (expression.name === 'exists')
        && isField(expression.expression)
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
    return isType(field, ['boolean']);
  }

  identify(expression) {
    if (isField(expression)) {
      return {
        field: expression.path,
        operand: null,
        operandIsField: false,
      };
    }
  }

  operand() {
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
    return isType(field, ['boolean']);
  }

  identify(expression) {
    if (
        (expression.name === 'not')
        && isField(expression.expression)
      ) {
      return {
        field: expression.expression.path,
        operand: null,
        operandIsField: false,
      };
    }
  }

  operand() {
    return null;
  }

  query(field) {
    return q.not(q.navigate(field.value));
  }
}


export const ALL_COMPARATORS: Array<Comparator> = [
  new Equal(),
  new NotEqual(),
  new Less(),
  new LessEqual(),
  new Greater(),
  new GreaterEqual(),
  new Contains(),
  new NotContains(),
  new Empty(),
  new NotEmpty(),
  new IsTrue(),
  new IsFalse(),
];


export function identify(expression: Query): ?FullIdentification {
  for (let i = 0; i < ALL_COMPARATORS.length; i++) {
    let identification = ALL_COMPARATORS[i].identify(expression);
    if (identification) {
      identification.comparator = ALL_COMPARATORS[i].value;
      return identification;
    }
  }
}


export function getApplicableForField(field: Navigation): Array<Comparator> {
  return ALL_COMPARATORS.filter((comp) => {
    return comp.applicable(field);
  });
}


export function getDefinition(comparatorName: string, comparatorCollection: ?Array<Comparator>): ?Comparator {
  comparatorCollection = comparatorCollection || ALL_COMPARATORS;
  for (let i = 0; i < comparatorCollection.length; i++) {
    if (comparatorCollection[i].value === comparatorName) {
      return comparatorCollection[i];
    }
  }
}

