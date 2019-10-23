/**
 * @flow
 */

import { type IntrospectionSchema } from "graphql/utilities/introspectionQuery";
import { print as gqlPrint } from "graphql/language/printer";
import { type ASTNode } from "graphql/language/ast";
import { buildQueryAST } from "./buildQueryAST";

export const buildQuery = ({
  schema,
  path
}: {
  schema: IntrospectionSchema,
  path: Array<string>
}) => {
  const ast = buildQueryAST({ schema, path });
  return gqlPrint(ast);
};
