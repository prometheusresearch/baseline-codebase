*************
Introspection
*************


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.tabular_import_demo')
    >>> from rex.tabular_import.introspect import *
    >>> from pprint import pprint


get_table_description
=====================

The get_table_description() function will return a dictionary that describes
the specified table.

It returns None if the table doesn't exist.::

    >>> with rex:
    ...     pprint(get_table_description('doesntexist'))
    None

It is capable of describing all HTSQL or rex.deploy data types::

    >>> with rex:
    ...     pprint(get_table_description('all_column_types'))
    {'columns': [{'default': 'generated: offset',
                  'identity': True,
                  'name': 'integer_field',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'boolean_field',
                  'required': True,
                  'type': {'name': 'boolean'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'decimal_field',
                  'required': True,
                  'type': {'name': 'decimal'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'float_field',
                  'required': True,
                  'type': {'name': 'float'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'text_field',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'date_field',
                  'required': True,
                  'type': {'name': 'date'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'time_field',
                  'required': True,
                  'type': {'name': 'time'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'datetime_field',
                  'required': True,
                  'type': {'name': 'datetime'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'json_field',
                  'required': True,
                  'type': {'name': 'json'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'enum_field',
                  'required': True,
                  'type': {'enumerations': ['foo', 'bar', 'baz'], 'name': 'enum'},
                  'unique': False}],
     'name': 'all_column_types'}

It can describe when columns are actually required::

    >>> with rex:
    ...     pprint(get_table_description('required_tests'))
    {'columns': [{'default': 'generated: offset',
                  'identity': True,
                  'name': 'code',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'is_required',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'not_required',
                  'required': False,
                  'type': {'name': 'text'},
                  'unique': False},
                 {'default': 'foo',
                  'identity': False,
                  'name': 'is_required_with_default',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': False},
                 {'default': 'foo',
                  'identity': False,
                  'name': 'not_required_with_default',
                  'required': False,
                  'type': {'name': 'text'},
                  'unique': False}],
     'name': 'required_tests'}

It can describe when columns are supposed to be unique::

    >>> with rex:
    ...     pprint(get_table_description('unique_tests'))
    {'columns': [{'default': 'generated: offset',
                  'identity': True,
                  'name': 'code',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'is_unique',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': True},
                 {'default': None,
                  'identity': False,
                  'name': 'not_unique',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': False}],
     'name': 'unique_tests'}

It can describe various relational data structures::

    >>> with rex:
    ...     pprint(get_table_description('trunk'))
    {'columns': [{'default': 'generated: offset',
                  'identity': True,
                  'name': 'code',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'a_field',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': False}],
     'name': 'trunk'}

    >>> with rex:
    ...     pprint(get_table_description('branch'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': 'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': 'trunk'},
                  'unique': False},
                 {'default': 'generated: offset',
                  'identity': True,
                  'name': 'code',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'some_field',
                  'required': True,
                  'type': {'name': 'boolean'},
                  'unique': False}],
     'name': 'branch'}

    >>> with rex:
    ...     pprint(get_table_description('facet'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': 'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': 'trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'another_field',
                  'required': True,
                  'type': {'name': 'float'},
                  'unique': False}],
     'name': 'facet'}

    >>> with rex:
    ...     pprint(get_table_description('another_trunk'))
    {'columns': [{'default': 'generated: offset',
                  'identity': True,
                  'name': 'code',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'some_data',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': False}],
     'name': 'another_trunk'}

    >>> with rex:
    ...     pprint(get_table_description('cross'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': 'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': 'trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': True,
                  'name': 'another_trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': 'another_trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'a_number',
                  'required': True,
                  'type': {'name': 'float'},
                  'unique': False}],
     'name': 'cross'}

    >>> with rex:
    ...     pprint(get_table_description('ternary'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': 'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': 'trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': True,
                  'name': 'another_trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': 'another_trunk'},
                  'unique': False},
                 {'default': 'generated: offset',
                  'identity': True,
                  'name': 'code',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'a_number',
                  'required': True,
                  'type': {'name': 'float'},
                  'unique': False}],
     'name': 'ternary'}

It describe tables without identities::

    >>> with rex:
    ...     pprint(get_table_description('no_identity'))
    {'columns': [{'default': None,
                  'identity': False,
                  'name': 'code',
                  'required': True,
                  'type': {'name': 'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': 'a_field',
                  'required': True,
                  'type': {'name': 'text'},
                  'unique': False}],
     'name': 'no_identity'}

