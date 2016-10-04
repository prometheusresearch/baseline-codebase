 /**
  * @flow
  */

/**
 * Type for the AST of rbt.
 *
 * Keep in mind that we need to make sure it is in sync with grammar.pegjs.
 */
export type Expression
  = BinaryOperation
  | Binding
  | Application
  | Identifier
  | StringLiteral
  | BooleanLiteral
  | IntegerLiteral;

export type BinaryOperation = {
  type: 'BinaryOperation';
  left: Expression;
  operator: string;
  right: Expression;
};

export type UnaryOperation = {
  type: 'UnaryOperation';
  operator: string;
  expression: Expression;
};

export type Binding = {
  type: 'Binding';
  name: string;
  expression: Expression;
};

export type Application = {
  type: 'Application';
  name: string;
  argList: Array<Expression>;
};

export type Identifier = {
  type: 'Identifier';
  value: string;
};

export type StringLiteral = {
  type: 'StringLiteral';
  value: string;
};

export type IntegerLiteral = {
  type: 'IntegerLiteral';
  value: number;
};

export type BooleanLiteral = {
  type: 'BooleanLiteral';
  value: boolean;
};

import {parse as _parse, SyntaxError} from './grammar';
import toQuery from './toQuery';

export {SyntaxError, toQuery};

export function parse(value: string): Expression {
  return (_parse(value): any);
}
