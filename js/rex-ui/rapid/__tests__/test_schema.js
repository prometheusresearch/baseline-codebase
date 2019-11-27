/**
 * @flow
 */

import { type IntrospectionSchema } from "graphql/utilities/introspectionQuery";

export const TEST_SCHEMA: IntrospectionSchema = {
  queryType: ({
    name: "Root",
  }: any),
  mutationType: ({
    name: "Mutations",
  }: any),
  directives: [],
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
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "String",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Boolean",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Int",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Float",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "JSON",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Decimal",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Date",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Datetime",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Time",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "Root",
      description: null,
      fields: [
        {
          name: "user",
          description: "Users",
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user_connection",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "patient",
          description: "Patients",
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "patient_connection",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "site",
          description: "Sites",
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "site_connection",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "search",
          description: null,
          args: [
            {
              name: "search",
              description: null,
              type: {
                kind: "NON_NULL",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "String",
                  ofType: null,
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "search_result",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
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
                  ofType: null,
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "OBJECT",
            name: "user",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "get_many",
          description: "Get multiple user by id",
          args: [
            {
              name: "id",
              description: null,
              type: {
                kind: "LIST",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "user_id",
                  ofType: null,
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "all",
          description: "Get all user items",
          args: [
            {
              name: "system_admin",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "expired",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "has_phone",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "search",
              description: null,
              type: {
                kind: "SCALAR",
                name: "String",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "sort",
              description: null,
              type: {
                kind: "INPUT_OBJECT",
                name: "sort_user_direction",
                ofType: null,
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
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
                ofType: null,
              },
              defaultValue: "0",
            },
            {
              name: "limit",
              description: "Fetch only this number of items",
              type: {
                kind: "SCALAR",
                name: "Int",
                ofType: null,
              },
              defaultValue: "20",
            },
            {
              name: "system_admin",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "expired",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "has_phone",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "search",
              description: null,
              type: {
                kind: "SCALAR",
                name: "String",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "sort",
              description: null,
              type: {
                kind: "INPUT_OBJECT",
                name: "sort_user_direction",
                ofType: null,
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "count",
          description: "Get the number of user items",
          args: [
            {
              name: "system_admin",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "expired",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "has_phone",
              description: null,
              type: {
                kind: "SCALAR",
                name: "Boolean",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "search",
              description: null,
              type: {
                kind: "SCALAR",
                name: "String",
                ofType: null,
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "Int",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
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
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "expires",
          description: null,
          args: [],
          type: {
            kind: "SCALAR",
            name: "Datetime",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "expired",
          description: null,
          args: [],
          type: {
            kind: "SCALAR",
            name: "Boolean",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
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
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "contact_info",
          description: "Contact information for the user",
          args: [],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "contact_info",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "phone",
          description: "User phone contact information",
          args: [],
          type: {
            kind: "OBJECT",
            name: "contact_info",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "patients",
          description: null,
          args: [],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "patient",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "sites",
          description: null,
          args: [],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user_x_site",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
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
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "contact_info",
      description: null,
      fields: [
        {
          name: "user",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "type",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "Enum_186cea82",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "value",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "String",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
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
              name: "contact_info_id",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "Enum_186cea82",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "contact_info_id",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "patient",
      description: null,
      fields: [
        {
          name: "name",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "String",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "date_of_birth",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "Date",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "caregiver",
          description: null,
          args: [],
          type: {
            kind: "OBJECT",
            name: "user",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
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
              name: "patient_id",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "patient_id",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "user_x_site",
      description: null,
      fields: [
        {
          name: "site",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "site",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "user",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "role",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "ENUM",
              name: "user_x_site_role",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
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
              name: "user_x_site_id",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "site",
      description: null,
      fields: [
        {
          name: "title",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "String",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "code",
          description: null,
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "String",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "users",
          description: null,
          args: [],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "user_x_site",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
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
              name: "site_id",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "site_id",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "ENUM",
      name: "user_x_site_role",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: [
        {
          name: "admin",
          description: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "user",
          description: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "user_x_site_id",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "SCALAR",
      name: "user_id",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "INPUT_OBJECT",
      name: "sort_user_direction",
      description: null,
      fields: null,
      inputFields: [
        {
          name: "field",
          description: null,
          type: {
            kind: "ENUM",
            name: "sort_user_field",
            ofType: null,
          },
          defaultValue: null,
        },
        {
          name: "desc",
          description: null,
          type: {
            kind: "SCALAR",
            name: "Boolean",
            ofType: null,
          },
          defaultValue: null,
        },
      ],
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "ENUM",
      name: "sort_user_field",
      description: null,
      fields: null,
      inputFields: null,
      interfaces: [],
      enumValues: [
        {
          name: "remote_user",
          description: null,
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "expires",
          description: null,
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "patient_connection",
      description: null,
      fields: [
        {
          name: "get",
          description: "Get patient by id",
          args: [
            {
              name: "id",
              description: null,
              type: {
                kind: "NON_NULL",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "patient_id",
                  ofType: null,
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "OBJECT",
            name: "patient",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "get_many",
          description: "Get multiple patient by id",
          args: [
            {
              name: "id",
              description: null,
              type: {
                kind: "LIST",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "patient_id",
                  ofType: null,
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "patient",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "all",
          description: "Get all patient items",
          args: [
            {
              name: "caregiver",
              description: null,
              type: {
                kind: "SCALAR",
                name: "user_id",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "search",
              description: null,
              type: {
                kind: "SCALAR",
                name: "String",
                ofType: null,
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "patient",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "paginated",
          description: "Get all patient items (paginated)",
          args: [
            {
              name: "offset",
              description: "Fetch skipping this number of items",
              type: {
                kind: "SCALAR",
                name: "Int",
                ofType: null,
              },
              defaultValue: "0",
            },
            {
              name: "limit",
              description: "Fetch only this number of items",
              type: {
                kind: "SCALAR",
                name: "Int",
                ofType: null,
              },
              defaultValue: "20",
            },
            {
              name: "caregiver",
              description: null,
              type: {
                kind: "SCALAR",
                name: "user_id",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "search",
              description: null,
              type: {
                kind: "SCALAR",
                name: "String",
                ofType: null,
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "patient",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "count",
          description: "Get the number of patient items",
          args: [
            {
              name: "caregiver",
              description: null,
              type: {
                kind: "SCALAR",
                name: "user_id",
                ofType: null,
              },
              defaultValue: null,
            },
            {
              name: "search",
              description: null,
              type: {
                kind: "SCALAR",
                name: "String",
                ofType: null,
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "Int",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "site_connection",
      description: null,
      fields: [
        {
          name: "get",
          description: "Get site by id",
          args: [
            {
              name: "id",
              description: null,
              type: {
                kind: "NON_NULL",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "site_id",
                  ofType: null,
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "OBJECT",
            name: "site",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "get_many",
          description: "Get multiple site by id",
          args: [
            {
              name: "id",
              description: null,
              type: {
                kind: "LIST",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "site_id",
                  ofType: null,
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "site",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "all",
          description: "Get all site items",
          args: [],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "site",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "paginated",
          description: "Get all site items (paginated)",
          args: [
            {
              name: "offset",
              description: "Fetch skipping this number of items",
              type: {
                kind: "SCALAR",
                name: "Int",
                ofType: null,
              },
              defaultValue: "0",
            },
            {
              name: "limit",
              description: "Fetch only this number of items",
              type: {
                kind: "SCALAR",
                name: "Int",
                ofType: null,
              },
              defaultValue: "20",
            },
          ],
          type: {
            kind: "LIST",
            name: null,
            ofType: {
              kind: "OBJECT",
              name: "site",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "count",
          description: "Get the number of site items",
          args: [],
          type: {
            kind: "NON_NULL",
            name: null,
            ofType: {
              kind: "SCALAR",
              name: "Int",
              ofType: null,
            },
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "search_result",
      description: null,
      fields: [
        {
          name: "id",
          description: null,
          args: [],
          type: {
            kind: "SCALAR",
            name: "String",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "type",
          description: null,
          args: [],
          type: {
            kind: "SCALAR",
            name: "String",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "label",
          description: null,
          args: [],
          type: {
            kind: "SCALAR",
            name: "String",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
    {
      kind: "OBJECT",
      name: "Mutations",
      description: null,
      fields: [
        {
          name: "remove_user",
          description: null,
          args: [
            {
              name: "user_ids",
              description: null,
              type: {
                kind: "NON_NULL",
                name: null,
                ofType: {
                  kind: "LIST",
                  name: null,
                  ofType: {
                    kind: "SCALAR",
                    name: "user_id",
                    ofType: null,
                  },
                },
              },
              defaultValue: null,
            },
          ],
          type: {
            kind: "SCALAR",
            name: "Boolean",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
        {
          name: "add_user_to_site",
          description: null,
          args: [
            {
              name: "user_ids",
              description: null,
              type: {
                kind: "NON_NULL",
                name: null,
                ofType: {
                  kind: "LIST",
                  name: null,
                  ofType: {
                    kind: "SCALAR",
                    name: "user_id",
                    ofType: null,
                  },
                },
              },
              defaultValue: null,
            },
            {
              name: "site_id",
              description: null,
              type: {
                kind: "NON_NULL",
                name: null,
                ofType: {
                  kind: "SCALAR",
                  name: "site_id",
                  ofType: null,
                },
              },
              defaultValue: null,
            },
            {
              name: "role",
              description: null,
              type: {
                kind: "ENUM",
                name: "user_x_site_role",
                ofType: null,
              },
              defaultValue: '"user"',
            },
          ],
          type: {
            kind: "SCALAR",
            name: "Boolean",
            ofType: null,
          },
          isDeprecated: false,
          deprecationReason: null,
        },
      ],
      inputFields: null,
      interfaces: [],
      enumValues: null,
      possibleTypes: [],
    },
  ],
};
