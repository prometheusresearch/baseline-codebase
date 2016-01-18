***********************
Configuration Functions
***********************


Set up the environment::

    >>> from rex.core import LatentRex
    >>> from pprint import pprint


get_all_definitions
===================

The ``get_all_definitions()`` function will return a list of dictionaries that
describe all Mart definitions available in the current instance::

    >>> from rex.mart import get_all_definitions

    >>> rex = LatentRex('rex.mart_demo')
    >>> with rex:
    ...     print [defn['id'] for defn in get_all_definitions()]
    ['empty', 'just_copy', 'just_deploy', 'some_data', 'some_more_data', 'some_sql_data', 'some_more_sql_data', 'both_etl_phases', 'some_data_with_params', 'existing', 'fixed_name', 'existing_missing', 'broken_htsql', 'broken_sql', 'simple_assessment', 'linked_assessment', 'linked_assessment_alltypes', 'calculated_assessment', 'overlap_names_assessment', 'select_json', 'broken_selector', 'datadictionary_deployment', 'datadictionary_assessment', 'datadictionary_alltypes']


get_definition
==============

The ``get_definition()`` function will return a dictionary describing a
specific Mart definition if it is available::

    >>> from rex.mart import get_definition

    >>> rex = LatentRex('rex.mart_demo')
    >>> with rex:
    ...     pprint(get_definition('just_deploy'))
    {'assessments': [],
     'base': {'fixed_name': None,
              'name_token': 'just_deploy_',
              'target': None,
              'type': 'fresh'},
     'deploy': [{'table': 'foo',
                 'title': 'Foo Bars',
                 'with': [{'column': 'col1',
                           'title': 'The First Column',
                           'type': 'text'},
                          {'identity': ['col1']},
                          {'column': 'col2',
                           'required': False,
                           'type': ['foo', 'bar', 'baz']}]}],
     'description': 'A Mart that just has empty tables',
     'id': 'just_deploy',
     'label': 'Just Deploy',
     'post_assessment_scripts': [],
     'post_deploy_scripts': [],
     'processors': [],
     'quota': {'per_owner': 3}}

    >>> with rex:
    ...     pprint(get_definition('doesntexist'))
    None


get_management_db_uri
=====================

The ``get_management_db_uri()`` function will return the DB connection
specification object that points at the management database::

    >>> from rex.mart import get_management_db_uri

    >>> rex = LatentRex('rex.mart_demo')
    >>> with rex:
    ...     get_management_db_uri()
    <DB pgsql:///mart_demo>

    >>> rex = LatentRex('rex.mart_demo', db='pgsql:something_else')
    >>> with rex:
    ...     get_management_db_uri()
    <DB pgsql:///something_else>


get_hosting_db_uri
==================

The ``get_hosting_db_uri()`` function will return the DB connection
specification object that points at the database system where Mart databases
are stored::

    >>> from rex.mart import get_hosting_db_uri

    >>> rex = LatentRex('rex.mart_demo', mart_hosting_cluster='pgsql://user:pass@someserver/mart')
    >>> with rex:
    ...     get_hosting_db_uri()
    <DB pgsql://user:pass@someserver/mart>

    >>> rex = LatentRex('rex.mart_demo')
    >>> with rex:
    ...     get_hosting_db_uri()
    <DB pgsql:///mart_demo>

    >>> rex = LatentRex('rex.mart_demo', db='pgsql:something_else')
    >>> with rex:
    ...     get_hosting_db_uri()
    <DB pgsql:///something_else>

    >>> rex = LatentRex('rex.mart_demo', db='sqlite:some_db.sqlite')
    >>> with rex:
    ...     get_hosting_db_uri()
    Traceback (most recent call last):
        ...
    Error: Only PostgreSQL systems can host Marts

    >>> rex = LatentRex('rex.mart_demo', mart_hosting_cluster='sqlite:some_db.sqlite')
    >>> with rex:
    ...     get_hosting_db_uri()
    Traceback (most recent call last):
        ...
    Error: Only PostgreSQL systems can host Marts
    While validating setting:
        mart_hosting_cluster

