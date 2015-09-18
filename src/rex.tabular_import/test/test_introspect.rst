*************
Introspection
*************


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.tabular_import_demo')
    >>> rexWithDeploy = Rex('rex.tabular_import_demo', htsql_extensions={'rex_deploy': {}})
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

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('doesntexist'))
    None

It is capable of describing all HTSQL or rex.deploy data types::

    >>> with rex:
    ...     pprint(get_table_description('all_column_types'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'integer_field',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'integer_field']]},
                 {'name': u'boolean_field',
                  'required': True,
                  'type': {'name': u'boolean'},
                  'unique': []},
                 {'name': u'decimal_field',
                  'required': True,
                  'type': {'name': u'decimal'},
                  'unique': []},
                 {'name': u'float_field',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []},
                 {'name': u'text_field',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'date_field',
                  'required': True,
                  'type': {'name': u'date'},
                  'unique': []},
                 {'name': u'time_field',
                  'required': True,
                  'type': {'name': u'time'},
                  'unique': []},
                 {'name': u'datetime_field',
                  'required': True,
                  'type': {'name': u'datetime'},
                  'unique': []},
                 {'name': u'json_field',
                  'required': True,
                  'type': {'name': u'opaque'},
                  'unique': []},
                 {'name': u'enum_field',
                  'required': True,
                  'type': {'enumerations': [u'foo', u'bar', u'baz'],
                           'name': u'enum'},
                  'unique': []}],
     'name': u'all_column_types'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('all_column_types'))
    {'columns': [{'name': u'integer_field',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'integer_field']]},
                 {'name': u'boolean_field',
                  'required': True,
                  'type': {'name': u'boolean'},
                  'unique': []},
                 {'name': u'decimal_field',
                  'required': True,
                  'type': {'name': u'decimal'},
                  'unique': []},
                 {'name': u'float_field',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []},
                 {'name': u'text_field',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'date_field',
                  'required': True,
                  'type': {'name': u'date'},
                  'unique': []},
                 {'name': u'time_field',
                  'required': True,
                  'type': {'name': u'time'},
                  'unique': []},
                 {'name': u'datetime_field',
                  'required': True,
                  'type': {'name': u'datetime'},
                  'unique': []},
                 {'name': u'json_field',
                  'required': True,
                  'type': {'name': u'json'},
                  'unique': []},
                 {'name': u'enum_field',
                  'required': True,
                  'type': {'enumerations': [u'foo', u'bar', u'baz'],
                           'name': u'enum'},
                  'unique': []}],
     'name': u'all_column_types'}

It can describe when columns are actually required::

    >>> with rex:
    ...     pprint(get_table_description('required_tests'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'is_required',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'not_required',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'is_required_with_default',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'not_required_with_default',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'required_tests'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('required_tests'))
    {'columns': [{'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'is_required',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'not_required',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'is_required_with_default',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': []},
                 {'name': u'not_required_with_default',
                  'required': False,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'required_tests'}

It can describe when columns are supposed to be unique::

    >>> with rex:
    ...     pprint(get_table_description('unique_tests'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'is_unique',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': [[u'is_unique']]},
                 {'name': u'not_unique',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'unique_tests'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('unique_tests'))
    {'columns': [{'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'is_unique',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': [[u'is_unique']]},
                 {'name': u'not_unique',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'unique_tests'}

It can describe various relational data structures::

    >>> with rex:
    ...     pprint(get_table_description('trunk'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'a_field',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'trunk'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('trunk'))
    {'columns': [{'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'a_field',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'trunk'}


    >>> with rex:
    ...     pprint(get_table_description('branch'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'trunk_id',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id', u'code']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id', u'code']]},
                 {'name': u'some_field',
                  'required': True,
                  'type': {'name': u'boolean'},
                  'unique': []}],
     'name': u'branch'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('branch'))
    {'columns': [{'name': u'trunk',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk', u'code']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk', u'code']]},
                 {'name': u'some_field',
                  'required': True,
                  'type': {'name': u'boolean'},
                  'unique': []}],
     'name': u'branch'}


    >>> with rex:
    ...     pprint(get_table_description('facet'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'trunk_id',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id']]},
                 {'name': u'another_field',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []}],
     'name': u'facet'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('facet'))
    {'columns': [{'name': u'trunk',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk']]},
                 {'name': u'another_field',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []}],
     'name': u'facet'}


    >>> with rex:
    ...     pprint(get_table_description('another_trunk'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'some_data',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'another_trunk'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('another_trunk'))
    {'columns': [{'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'code']]},
                 {'name': u'some_data',
                  'required': True,
                  'type': {'name': u'text'},
                  'unique': []}],
     'name': u'another_trunk'}


    >>> with rex:
    ...     pprint(get_table_description('cross'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'trunk_id',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id', u'another_trunk__id']]},
                 {'name': u'another_trunk__id',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id', u'another_trunk__id']]},
                 {'name': u'a_number',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []}],
     'name': u'cross'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('cross'))
    {'columns': [{'name': u'trunk',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk', u'another_trunk']]},
                 {'name': u'another_trunk',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk', u'another_trunk']]},
                 {'name': u'a_number',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []}],
     'name': u'cross'}


    >>> with rex:
    ...     pprint(get_table_description('ternary'))
    {'columns': [{'name': u'id',
                  'required': False,
                  'type': {'name': u'integer'},
                  'unique': [[u'id']]},
                 {'name': u'trunk_id',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id', u'another_trunk__id', u'code']]},
                 {'name': u'another_trunk__id',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id', u'another_trunk__id', u'code']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk_id', u'another_trunk__id', u'code']]},
                 {'name': u'a_number',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []}],
     'name': u'ternary'}

    >>> with rexWithDeploy:
    ...     pprint(get_table_description('ternary'))
    {'columns': [{'name': u'trunk',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk', u'another_trunk', u'code']]},
                 {'name': u'another_trunk',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk', u'another_trunk', u'code']]},
                 {'name': u'code',
                  'required': True,
                  'type': {'name': u'integer'},
                  'unique': [[u'trunk', u'another_trunk', u'code']]},
                 {'name': u'a_number',
                  'required': True,
                  'type': {'name': u'float'},
                  'unique': []}],
     'name': u'ternary'}

