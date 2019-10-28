/**
 * @flow
 */

import { type IntrospectionSchema } from "graphql/utilities/introspectionQuery";
import { print as gqlPrint } from "graphql/language/printer";
import {
  type DocumentNode,
  type SelectionNode,
  type FieldNode
} from "graphql/language/ast";
import { buildQueryAST } from "./buildQueryAST";

export const buildQuery = ({
  schema,
  path
}: {
  schema: IntrospectionSchema,
  path: Array<string>
}): {| query: string, ast: DocumentNode, columns: FieldNode[] |} => {
  const { ast, columns } = buildQueryAST({ schema, path });
  const query = gqlPrint(ast);

  console.log("query: ", query);

  return {
    query,
    ast,
    columns
  };
};
