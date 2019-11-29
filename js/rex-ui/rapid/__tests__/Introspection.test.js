/**
 * @flow
 */

import { introspect } from "../Introspection";
import * as QueryPath from "../QueryPath.js";
import { TEST_SCHEMA } from "./test_schema";

const queryUserPaginated = `query ConstructedQuery($offset: Int, $limit: Int, $system_admin: Boolean, $expired: Boolean, $has_phone: Boolean, $search: String, $sort: sort_user_direction) {
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

const queryUser = `query ConstructedQuery($system_admin: Boolean, $expired: Boolean, $has_phone: Boolean, $search: String) {
  user {
    count(system_admin: $system_admin, expired: $expired, has_phone: $has_phone, search: $search)
  }
}
`;

const queryNestedFields = `query ConstructedQuery($system_admin: Boolean, $expired: Boolean, $has_phone: Boolean, $search: String, $sort: sort_user_direction) {
  user {
    all(system_admin: $system_admin, expired: $expired, has_phone: $has_phone, search: $search, sort: $sort) {
      remote_user
      contact_info {
        user {
          contact_info {
            user
          }
        }
      }
      patients {
        name
      }
      id
    }
  }
}
`;

describe("Testing introspect", function() {
  it("Should be equal to queryNestedFields reference value", function() {
    let { query, fieldSpecs, description, filterSpecs } = introspect({
      schema: TEST_SCHEMA,
      path: QueryPath.make(["user", "all"]),
      fields: {
        contact_info: {
          require: {
            field: "contact_info",
            require: [
              {
                field: "user",
                require: [
                  {
                    field: "contact_info",
                    require: [{ field: "user" }],
                  },
                ],
              },
            ],
          },
        },
        patients: {
          require: {
            field: "patients",
            require: [
              {
                field: "name",
              },
            ],
          },
        },
        remote_user: "remote_user",
      },
    });

    expect(query).toEqual(queryNestedFields);
  });

  it("Should be equal to queryUser reference value", function() {
    let { query, fieldSpecs, description, filterSpecs } = introspect({
      schema: TEST_SCHEMA,
      path: QueryPath.make(["user"]),
      fields: null,
    });

    expect(query).toEqual(queryUser);
    expect(fieldSpecs).toEqual({
      count: { require: { field: "count" }, title: "Count" },
    });
    expect(description).toEqual("Users");
  });

  it("Should be equal to queryUserPaginated reference value", function() {
    let expectation = introspect({
      schema: TEST_SCHEMA,
      path: QueryPath.make(["user", "paginated"]),
      fields: null,
    }).query;

    expect(expectation).toEqual(queryUserPaginated);
  });

  it("Should not find Root.userz field", function() {
    expect(() =>
      introspect({
        schema: TEST_SCHEMA,
        path: QueryPath.make(["userz"]),
        fields: null,
      }),
    ).toThrowError('No field "Root.userz" found');
  });

  it("Should not find user_connection.paginated_ field", function() {
    expect(() =>
      introspect({
        schema: TEST_SCHEMA,
        path: QueryPath.make(["user", "paginated_"]),
        fields: {},
      }),
    ).toThrowError('No field "user_connection.paginated_" found');
  });

  it("Expecting to throw", function() {
    let nullRootTypes = TEST_SCHEMA.types.reduce((acc, type) => {
      return type.name === TEST_SCHEMA.queryType.name ? acc : [...acc, type];
    }, []);

    expect(() => {
      introspect({
        schema: { ...TEST_SCHEMA, types: nullRootTypes },
        path: QueryPath.make(["user.paginated"]),
      });
    }).toThrowError("Expected ObjectType at the root");
  });

  it("Expecting to throw on rootType as Map", function() {
    let invalidRootTypes = TEST_SCHEMA.types.reduce((acc, type) => {
      if (type.name === TEST_SCHEMA.queryType.name) {
        let invalidRootType = (new Map(): any);
        invalidRootType.name = TEST_SCHEMA.queryType.name;

        return [...acc, (invalidRootType: any)];
      }
      return [...acc, type];
    }, []);

    expect(() => {
      introspect({
        schema: { ...TEST_SCHEMA, types: invalidRootTypes },
        path: QueryPath.make("user.paginated"),
      });
    }).toThrowError("Expected rootType as OBJECT at the root");
  });

  it("Expecting to throw", function() {
    let invalidTypes = TEST_SCHEMA.types.reduce((acc, type) => {
      if (type.kind === "OBJECT" && type.name === "user") {
        let invalidType = {
          ...type,
          kind: "INVALID",
        };

        return [...acc, (invalidType: any)];
      }

      return [...acc, type];
    }, []);

    expect(() => {
      introspect({
        schema: { ...TEST_SCHEMA, types: invalidTypes },
        path: QueryPath.make("user.paginated"),
      });
    }).toThrowError("Expected object type for nextType.kind");
  });
});
