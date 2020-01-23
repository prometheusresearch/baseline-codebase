// @flow

declare module "rex-expression" {
  declare export type REXLResolver = (id: string) => mixed;

  declare export type REXLExpression = {
    evaluate(resolver: REXLResolver): mixed,
  };

  declare export type REXLValue = mixed;

  declare export function parse(expression: string): REXLExpression;

  declare export var Untyped: {
    value(value: mixed): REXLValue,
  };
}
