Code org:

  1. Remove nesting of modules
  2. `constructors/*` -> `buildQuery.js` which exports single function
    `buildQuery(fetch: string, schema): string`
  3. Consolidate small modules into a single `Helpers.js` module.
  4. Props types should be collocated with the component code.
  5. Remove `T`-prefix from types.
  6. Fix lint errors.
  7. Remove nested `Suspense` - it should be only at the top level of the app
     (`rex-demo-ui` in this case).
  8. Fix hooks usage (some hooks are being called conditionally, see `Pick.js`)
  9. Use `makeStyles` instead of `withStyles`.
     See https://v3.material-ui.com/css-in-js/basics/

Tests:

  1. Do not test what flow can catch
  2. Test `buildQuery.js`

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
