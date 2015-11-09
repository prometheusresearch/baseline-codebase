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
    ...     pass #pprint(get_all_definitions())



get_definition
==============

The ``get_definition()`` function will return a dictionary describing a
specific Mart definition if it is available::

    >>> from rex.mart import get_definition

    >>> rex = LatentRex('rex.mart_demo')
    >>> with rex:
    ...     pass #pprint(get_definition('foo'))


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

