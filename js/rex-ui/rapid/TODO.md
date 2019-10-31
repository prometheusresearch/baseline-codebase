# Rapid

## DEMO 1

### PICK

#### Features/Bugs

- [x] Pagination has fixed values for mobile and desktop modes (50 and 20 relatively)
- [x] Automatic column config shouldn't show objects. See `phone` and `contact_info` in user table
- [x] Render `null` as `—`
- [x] Add `title` and `description` props
- [x] Add toggleable filter list
- [x] Default renderer for bools should show `yes` or `no`

#### Baseline usage

Basic usage allows to quickly scaffold UI:

    <Pick
      endpoint={endpoint}
      fetch="user.paginated"
      />

This will give you automatically configured:

- [x] A datatable or a card list depending on a screen size

- [x] A sensible set of displayed fields
  - [x] Only scalar fields are shown
  - [ ] First we should prioritize some hard coded set of fields (id, name,
        first_name, last_name, title, display_name, gender, sex, ...)

- [x] Pagination (both for datatable and card list)
  - [x] Fixed page size (50) for table
  - [x] Fixed page size (20) for card list

- [ ] Sortable (both for datatable and card list)
  - [x] Look for argument named `sort` of type `{field : ENUM, desc: Boolean}`
  - [ ] Table view: Check for mathcing columns and make those columns sortable
    (click on columns should trigger sort)
  - [x] Render `<Select />` with sort options

    - `Sort by 'remote_user'` -> `{field: 'remote_user', desc: false}`
    - `Sort by 'remote_user' (reverse)` -> `{field: 'remote_user', desc: true}`
    - `Sort by 'expires'` -> `{field: 'expires', desc: false}`
    - `Sort by 'expires' (reverse)` -> `{field: 'expires', desc: true}`

  - [ ] Card view: highlight field we are sorting on

- [x] Filters (both for datatable and card list)
  - [x] Enums
  - [x] Booleans

#### Customizing Fields Config

[ ] We can simply pass a list of fields as string:

    let fields = [
      'remote_user',
      'date_created',
      'is_admin',
    ]

    <Pick
      endpoint={endpoint}
      fetch="user.paginated"
      fields={fields}
      />

[ ] We can also specify a component to render each specific field:

    function CheckboxField(props: {value: boolean}) {
      return <div>{props.value}</div>
    }

    let fields = [
      'remote_user',
      'date_created',
      {
        key: 'is_admin',
        require: ['is_admin'], // implicitly defined as [key]
        render: CheckboxField
      }
    ]

    <Pick
      endpoint={endpoint}
      fetch="user.paginated"
      fields={fields}
      />

We can specify a computed field which can produce a value by querying multiple
fields:

    let nameField = {
      require: ['first_name', 'last_name'],
      key: 'name',
      compute: (row) => `${row.first_name} ${row.last_name}`,
    }

    let fields = [
      'remote_user',
      nameField,
    ]

    user { paginated { remote_user first_name last_name } }

    <Pick
      endpoint={endpoint}
      fetch="user.paginated"
      fields={fields}
      />

Nested fields:

    let phoneField = {
      key: 'phone.value',
      require: ['phone.value'],
    }

    let fields = [
      'remote_user',
      phoneField,
    ]

    user {
      paginated {
        remote_user
        phone {
          value
        }
      }
    }

    <Pick
      endpoint={endpoint}
      fetch="user.paginated"
      fields={fields}
      />

    // IDEA!
    let q = new Query(); // {}
    q.add('user.paginated') // ERROR! not a scalar!
    q.add('user.paginated.name') // {user{paginated{name}}}
    q.add('user.paginated.phone.value') // {user{paginated{name phone{value}}}}

Type for the field config:

    type FieldConfig =
      | string
      | {
          key: string,
          require?: string[],
          compute?: any => any,
          render?: React.AbstractComponent<{value: any}>,
          /**
           * Width of the column in table view, a string like '100px' or a flex
           * grow value.
          */
          width?: ?string | number,
        }

#### Customizing Filters Config

    let filters: FilterConfig[] = [
      'system_admin',
    ]

    <Pick filters={filters} ... />

    type FilterConfig =
      | string // same as {key: string}
      | {
          key: string,
          /** Render a filter component and allow it to update args. */
          render: React.AbstractComponent<{args: Args, onArgs: Args => void}>
        }

    type Args = {[name: string]: string}

### SHOW