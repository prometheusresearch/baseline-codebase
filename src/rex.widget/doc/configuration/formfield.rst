Form fields
===========

Form fields is a mechanism in Rex Widget to configure forms through YAML.
Packages like Rex Action use form fields as a part of their configuration API
(for example to configure ``make``, ``edit`` or ``view`` actions).

Usually it looks like::

  fields:
  - type: string
    value_key: first_name
  - type: string
    value_key: last_name

Common configuration parameters
-------------------------------

Some of the form field parameters are common across types. They are documented
below. For type specific parameters consult the form fiel type reference.

**type** (optional, default: ``string``)
  Type of the form field. If not provided then it defaults to ``string``.

**value_key** (required)
  Specifies a key path inside the form value which this form field should
  operate on.

**label** (optional)
  Label of the form field.

**hint** (optional)
  Hint of the form field. Provide useful information here which will help users
  to correctly enter the form value.

**required** (optional, default: ``false``)
  If the form field should be required. Form won't submit if value is not
  present in its value.

**read_only** (optional, default: ``false``)
  If the form field should render in read only mode which doesn't allow users to
  modify its value.

**hide_if** (optional)
  JavaScript expression which can reference ``$value`` (the current value of the
  field) and ``$fields`` (the value of the fieldset the field is in). If the
  expression evaluates to ``true`` then form field will be hidden and its value
  won't be present in the form value on submit.

  Example::

    - value_key: age
      type: number
    - value_key: address
      type: string
      hide_if: $fields.age < 18

  In this case the ``address`` form field will be hidden if user entered ``age``
  value which is less than ``18``.

**validate** (optional)
  HTSQL expression which is used to validate the form field value. It can
  reference the following variables:

  - ``$value`` - the value of the field
  - ``$id`` - the identifier of the record being edited
  - ``$root`` - form's root value
  - ``$parent`` - parent fieldset's value

  If HTSQL expression returns ``null()`` then validation succeeds; otherwise
  return a string which is treated as error message.

  Note that query specified in ``validate`` is affected by configured masks.


Form field types
----------------

Below is a list of form fields available in Rex Widget. Note that other
libraries and applications can add own form field type so this list might be non
complete for any given application.

string
~~~~~~

The form field which is rendered as a text input.

The following additional parameters are available:

**pattern** (optional)
  Regular expression pattern which is used to validate the form field value.

**error** (optional)
  Error message to use if validation fails.

note
~~~~

The form field which is rendered as a multiline text input.

The following additional parameters are available:

**pattern** (optional)
  Regular expression pattern which is used to validate the form field value.

**error** (optional)
  Error message to use if validation fails.

integer
~~~~~~~

The form field which is rendered as a text input whuch only accepts integer
numbers.

No additional parameters.

number
~~~~~~

The form field which is rendered as a text input whuch only accepts numbers.

bool
~~~~

The form field which is rendered as a checkbox.

No additional parameters.

date
~~~~

The form field which is rendered as a date picker.

The following additional parameters are available:

**max_date** (optional)
  The higher bound of the value in ``YYYY-MM-DD`` format (or ``today``,
  ``tomorrow``, ``yesterday``).

**min_date** (optional)
  The lower bound of the value in ``YYYY-MM-DD`` format (or ``today``,
  ``tomorrow``, ``yesterday``).

datetime
~~~~~~~~

The form field which is rendered as a date time picker.

No additional parameters.

file
~~~~

The form field which is rendered as a file upload.

The following additional parameters are available:

**column** (required)
  The ``<table>.column`` pointer to a column which points to a file link.

**storage** (optional, default: ``rex.file:/``)
  The storage to use.

enum
~~~~

The form field which is rendered as a select input.

The following additional parameters are available:

**options** (required)
  An array of options with ``value`` and ``label`` params.

  Example::

    - type: enum
      value_key: sex
      options:
      - value: female
        label: Female
      - value: male
        label: Male
      - value: other
        label: Other

entity
~~~~~~

The form field for picking an entity from a related table.

The following additional parameters are available:

**data** (required)
  Specifies how to fetch options.

  The following parameters are available:

  **entity** (required)
    The name of the table.

  **title** (required)
    HTSQL expression which is used as a title.

  **select** (optional)
    A list of additional columns to select from a table (a list of HTSQL
    expressions).

  **mask** (optional)
    HTSQL expression which will be used as a mask for table.

**limit** (optional, default: ``50``)
  Determines how many items this widget will show. This is only applicable for
  ``autocompelte`` widget right now. Set to ``null`` to show all items in the
  database (warning: that may slow down an app a lot if the corresponding entity
  table has a lot of records).

**using** (optional, default: ``autocomplete``)
  Determines what widget. Either ``autocomplete`` or ``radio-group``.

entity-list
~~~~~~~~~~~

The form field for picking multiple entities from a related table.

The following additional parameters are available:

**data** (required)
  Specifies how to fetch options.

  The following parameters are available:

  **entity** (required)
    The name of the table.

  **title** (required)
    HTSQL expression which is used as a title.

  **select** (optional)
    A list of additional columns to select from a table (a list of HTSQL
    expressions).

  **mask** (optional)
    HTSQL expression which will be used as a mask for table.

**plain** (optional: default: ``false``)
  Allows to change form field mode to work on a list of plain identifiers rather
  than a list of objects with attrinbute id. This maybe useful when the handler
  of the form is an HTSQL query rather than a port.

calculation
~~~~~~~~~~~

The form field which renders a result of an HTSQL expression.

The following additional parameters are available:

**expression** (required)
  HTSQL expression.

fieldset
~~~~~~~~

Fieldset.

The following additional parameters are available:

**fields** (required)
  A list of form fields with the fielset.

list
~~~~

List of fieldsets.

The following additional parameters are available:

**fields** (required)
  A list of form fields with the list.

**layout** (optional, oneof ``horizontal``, ``vertical``, default: ``horizontal``)
  Form field layout.
