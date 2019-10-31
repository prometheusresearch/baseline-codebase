/**
 * @flow
 */

import {
  type IntrospectionSchema,
  type IntrospectionType
} from "graphql/utilities/introspectionQuery";
import { print as gqlPrint } from "graphql/language/printer";
import {
  type DocumentNode,
  type SelectionNode,
  type FieldNode,
  type OperationDefinitionNode
} from "graphql/language/ast";
import { buildQueryAST } from "./buildQueryAST";

export const buildQuery = ({
  schema,
  path
}: {
  schema: IntrospectionSchema,
  path: Array<string>
}): {|
  query: string,
  ast: DocumentNode,
  columns: FieldNode[],
  introspectionTypesMap: Map<string, IntrospectionType>,
  queryDefinition: OperationDefinitionNode
|} => {
  const {
    ast,
    columns,
    queryDefinition,
    introspectionTypesMap
  } = buildQueryAST({ schema, path });
  const query = gqlPrint(ast);

  console.log(query);
  return {
    query,
    ast,
    columns,
    queryDefinition,
    introspectionTypesMap
  };
};
