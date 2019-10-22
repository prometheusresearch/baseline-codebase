/**
 * @flow
 */

import { type IntrospectionSchema } from "graphql/utilities/introspectionQuery";
import { print as gqlPrint } from "graphql/language/printer";
import { type ASTNode } from "graphql/language/ast";

export const constructQuery = (ast: ASTNode) => gqlPrint(ast);
