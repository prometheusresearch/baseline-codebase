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
    {'columns': [{'default': u'generated: offset',
                  'identity': True,
                  'name': u'integer_field',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'boolean_field',
                  'required': True,
                  'type': {'name': u'boolean'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'decimal_field',
                  'required': True,
                  'type': {'name': u'decimal'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'float_field',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'text_field',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'date_field',
                  'required': True,
                  'type': {'name': u'date'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'time_field',
                  'required': True,
                  'type': {'name': u'time'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'datetime_field',
                  'required': True,
                  'type': {'name': u'datetime'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'json_field',
                  'required': True,
                  'type': {'name': u'json'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'enum_field',
                  'required': True,
                  'type': {'enumerations': [u'foo', u'bar', u'baz'],
                           'name': 'enum'},
                  'unique': False}],
     'name': u'all_column_types'}

It can describe when columns are actually required::

    >>> with rex:
    ...     pprint(get_table_description('required_tests'))
    {'columns': [{'default': u'generated: offset',
                  'identity': True,
                  'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'is_required',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'not_required',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': False},
                 {'default': u'foo',
                  'identity': False,
                  'name': u'is_required_with_default',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': False},
                 {'default': u'foo',
                  'identity': False,
                  'name': u'not_required_with_default',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': False}],
     'name': u'required_tests'}

It can describe when columns are supposed to be unique::

    >>> with rex:
    ...     pprint(get_table_description('unique_tests'))
    {'columns': [{'default': u'generated: offset',
                  'identity': True,
                  'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'is_unique',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': True},
                 {'default': None,
                  'identity': False,
                  'name': u'not_unique',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': False}],
     'name': u'unique_tests'}

It can describe various relational data structures::

    >>> with rex:
    ...     pprint(get_table_description('trunk'))
    {'columns': [{'default': u'generated: offset',
                  'identity': True,
                  'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'a_field',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': False}],
     'name': u'trunk'}

    >>> with rex:
    ...     pprint(get_table_description('branch'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': u'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': u'trunk'},
                  'unique': False},
                 {'default': u'generated: offset',
                  'identity': True,
                  'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'some_field',
                  'required': True,
                  'type': {'name': u'boolean'},
                  'unique': False}],
     'name': u'branch'}

    >>> with rex:
    ...     pprint(get_table_description('facet'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': u'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': u'trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'another_field',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': False}],
     'name': u'facet'}

    >>> with rex:
    ...     pprint(get_table_description('another_trunk'))
    {'columns': [{'default': u'generated: offset',
                  'identity': True,
                  'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'some_data',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': False}],
     'name': u'another_trunk'}

    >>> with rex:
    ...     pprint(get_table_description('cross'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': u'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': u'trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': True,
                  'name': u'another_trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': u'another_trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'a_number',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': False}],
     'name': u'cross'}

    >>> with rex:
    ...     pprint(get_table_description('ternary'))
    {'columns': [{'default': None,
                  'identity': True,
                  'name': u'trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': u'trunk'},
                  'unique': False},
                 {'default': None,
                  'identity': True,
                  'name': u'another_trunk',
                  'required': True,
                  'type': {'name': 'link', 'target': u'another_trunk'},
                  'unique': False},
                 {'default': u'generated: offset',
                  'identity': True,
                  'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': False},
                 {'default': None,
                  'identity': False,
                  'name': u'a_number',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': False}],
     'name': u'ternary'}

