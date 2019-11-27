/**
 * @flow
 */

import { introspect } from "../Introspection";
import * as QueryPath from "../QueryPath.js";
import { TEST_SCHEMA } from "./test_schema";

export const queryUserPaginated = `query ConstructedQuery($offset: Int, $limit: Int, $system_admin: Boolean, $expired: Boolean, $has_phone: Boolean, $search: String, $sort: sort_user_direction) {
  user {
    paginated(offset: $offset, limit: $limit, system_admin: $system_admin, expired: $expired, has_phone: $has_phone, search: $search, sort: $sort) {
      remote_user
      expires
      expired
      system_admin
      id
    }
  }
}
`;

describe("Testing constructQueryAST", function() {
  it("Result of introspect execution should be equal to queryUserPaginated reference value", function() {
    let expectation = introspect({
      schema: TEST_SCHEMA,
      path: QueryPath.make(["user", "paginated"]),
      fields: null,
    }).query;

    expect(expectation).toEqual(queryUserPaginated);
  });
});
