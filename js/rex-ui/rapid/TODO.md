Features:

  1. Pick: while building a query/inspecting schema:

      - Infer column config

        Describe columns with ColumnConfig type

      - Add pagination

      - Infer filter config

        Describe filters with FilterConfig type. While building query config
        filters.

        user.paginated(system_admin: Boolean)

        {
          type: 'boolean-filter',
          name: 'system_admin'
        }


Tests:

  1. Test `Pick.js` (see react-testing-library)

Stories:

```
<Pick
  endpoint="/_api/graphql"
  fetch="user.paginated"
```
