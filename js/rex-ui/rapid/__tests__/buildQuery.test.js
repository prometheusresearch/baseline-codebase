/**
 * @flow
 */

import { type IntrospectionSchema } from "graphql/utilities/introspectionQuery";
import { buildQuery } from "../buildQuery";

const testSchema: IntrospectionSchema = {
  queryType: ({
    name: "Root"
  }: any),
  mutationType: null,
  subscriptionType: null,
  types: [
    {
      kind: "SCALAR",
      name: "ID",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "String",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "Boolean",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "Int",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "Float",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "JSON",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "Decimal",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "Date",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "Datetime",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "Time",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "OBJECT",
      name: "Root",
      description: null,
      fields: [
        {
          name: "user",
          description: "Connection to user",
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user_connection",
              ofType: null
            }
          },
          isDeprecated: false,
          deprecationReason: null
        }
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "OBJECT",
      name: "user_connection",
      description: null,
      fields: [
        {
          name: "get",
          description: "Get user by id",
          args: [
            {
              name: "id",
              description: null,
              type: {
                kind: "NON_NULL",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "user_id",
                  ofType: null
                }
              },
              defaultValue: null
            }
          ],
          type: {
            kind: "OBJECT",
            name: "user",
            ofType: null
          },
          isDeprecated: false,
          deprecationReason: null
        },
        {
          name: "all",
          description: "Get all user items",
          args: [],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user",
              ofType: null
            }
          },
          isDeprecated: false,
          deprecationReason: null
        },
        {
          name: "paginated",
          description: "Get all user items (paginated)",
          args: [
            {
              name: "offset",
              description: "Fetch skipping this number of items",
              type: {
                kind: "SCALAR",
                name: "Int",
                ofType: null
              },
              defaultValue: "0"
            },
            {
              name: "limit",
              description: "Fetch only this number of items",
              type: {
                kind: "SCALAR",
                name: "Int",
                ofType: null
              },
              defaultValue: "20"
            }
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user",
              ofType: null
            }
          },
          isDeprecated: false,
          deprecationReason: null
        },
        {
          name: "count",
          description: "Get the number of user items",
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "Int",
              ofType: null
            }
          },
          isDeprecated: false,
          deprecationReason: null
        }
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "OBJECT",
      name: "user",
      description: null,
      fields: [
        {
          name: "remote_user",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "String",
              ofType: null
            }
          },
          isDeprecated: false,
          deprecationReason: null
        },
        {
          name: "expires",
          description: null,
          args: [],
          type: {
            kind: "SCALAR",
            name: "Datetime",
            ofType: null
          },
          isDeprecated: false,
          deprecationReason: null
        },
        {
          name: "system_admin",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "Boolean",
              ofType: null
            }
          },
          isDeprecated: false,
          deprecationReason: null
        },
        {
          name: "id",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "user_id",
              ofType: null
            }
          },
          isDeprecated: false,
          deprecationReason: null
        }
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    },
    {
      kind: "SCALAR",
      name: "user_id",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: []
    }
  ],
  directives: []
};

const referenceQuery = `query ConstructedQuery($offset: Int, $limit: Int) {
  user {
    paginated(offset: $offset, limit: $limit) {
      remote_user
      expires
      system_admin
      id
    }
  }
}
`;

describe("Testing constructQueryAST", function() {
  it("Should be equal to referenceQuery", function() {
    expect(
      buildQuery({
        schema: testSchema,
        path: ["user", "paginated"]
      }).query
    ).toEqual(referenceQuery);
  });
});
