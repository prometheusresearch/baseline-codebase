**********************
  Cluster management
**********************

.. contents:: Table of Contents


Creating and dropping databases
===============================

Use function ``get_cluster()`` to get a ``Cluster`` object associated with the
application database::

    >>> from rex.core import Rex
    >>> demo = Rex('rex.deploy_demo')

    >>> from rex.deploy import get_cluster
    >>> with demo:
    ...     cluster = get_cluster()

    >>> cluster
    Cluster('pgsql:///deploy_demo')

``get_cluster()`` only works with PostgreSQL databases::

    >>> from rex.core import LatentRex
    >>> with LatentRex('rex.deploy_demo', db='mysql:///deploy_demo'):
    ...     get_cluster()
    Traceback (most recent call last):
      ...
    Error: Expected a PostgreSQL database; got:
        mysql:///deploy_demo

You can use the ``Cluster`` object to test, create and destroy databases
in the database cluster::

    >>> cluster.create('deploy_demo_derived')
    >>> cluster.exists('deploy_demo_derived')
    True

    >>> cluster.drop('deploy_demo_derived')
    >>> cluster.exists('deploy_demo_derived')
    False

It is an error if you try to create a database which already exists or
drop a database which does not exist::

    >>> cluster.drop('deploy_demo_derived')
    Traceback (most recent call last):
      ...
    Error: Got an error from the database server:
        database "deploy_demo_derived" does not exist


Connecting to the database
==========================

``Cluster`` object allows you to create a connection to the application
database or any other database in the same cluster::

    >>> connection = cluster.connect()
    >>> connection                  # doctest: +ELLIPSIS
    <connection object at ...; dsn: 'dbname=deploy_demo', closed: 0>
    >>> connection.close()

    >>> cluster.create('deploy_demo_derived')
    >>> connection = cluster.connect('deploy_demo_derived')
    >>> connection                  # doctest: +ELLIPSIS
    <connection object at ...; dsn: 'dbname=deploy_demo_derived', closed: 0>
    >>> connection.close()

It is an error to try to connect to a database which does not exist::

    >>> cluster.drop('deploy_demo_derived')
    >>> cluster.connect('deploy_demo_derived')
    Traceback (most recent call last):
      ...
    Error: Failed to connect to the database server:
        FATAL:  database "deploy_demo_derived" does not exist

``Cluster`` uses connection parameters from the given connection URI::

    >>> from rex.deploy import Cluster
    >>> cluster_2345 = Cluster('pgsql://aladdin:opensesame@127.0.0.1:2345/deploy_demo')
    >>> cluster_2345.connect()      # doctest: +NORMALIZE_WHITESPACE
    Traceback (most recent call last):
      ...
    Error: Failed to connect to the database server:
        could not connect to server: Connection refused
        	Is the server running on host "127.0.0.1" and accepting
        	TCP/IP connections on port 2345?



