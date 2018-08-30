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

You can use the ``Cluster`` object to test and create databases in the database
cluster::

    >>> cluster.create('deploy_demo_cluster')
    >>> cluster.exists('deploy_demo_cluster')
    True

You can also clone an existing database::

    >>> cluster.clone('deploy_demo_cluster', 'deploy_demo_clone')
    >>> cluster.exists('deploy_demo_clone')
    True

Or rename it::

    >>> cluster.rename('deploy_demo_renamed', 'deploy_demo_clone')
    >>> cluster.exists('deploy_demo_clone')
    False
    >>> cluster.exists('deploy_demo_renamed')
    True

Or delete it::

    >>> cluster.drop('deploy_demo_renamed')

    >>> cluster.drop('deploy_demo_cluster')
    >>> cluster.exists('deploy_demo_cluster')
    False

It is an error if you try to create a database which already exists or
drop a database which does not exist::

    >>> cluster.drop('deploy_demo_cluster')
    Traceback (most recent call last):
      ...
    Error: Got an error from the database server:
        database "deploy_demo_cluster" does not exist


Connecting to the database
==========================

``Cluster`` object allows you to create a connection to the application
database or any other database in the same cluster::

    >>> connection = cluster.connect()
    >>> connection                  # doctest: +ELLIPSIS
    <connection object at ...; dsn: 'dbname=deploy_demo', closed: 0>
    >>> connection.close()

    >>> cluster.create('deploy_demo_cluster')
    >>> connection = cluster.connect('deploy_demo_cluster')
    >>> connection                  # doctest: +ELLIPSIS
    <connection object at ...; dsn: 'dbname=deploy_demo_cluster', closed: 0>
    >>> connection.close()

It is an error to try to connect to a database which does not exist::

    >>> cluster.drop('deploy_demo_cluster')
    >>> cluster.connect('deploy_demo_cluster')
    Traceback (most recent call last):
      ...
    Error: Failed to connect to the database server:
        FATAL:  database "deploy_demo_cluster" does not exist

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

You can create a deployment driver for a database from the cluster::

    >>> cluster.create('deploy_demo_cluster')
    >>> driver = cluster.drive('deploy_demo_cluster')
    >>> driver
    <Driver dbname=deploy_demo_cluster>

Using the driver, you can deploy any database facts or raw SQL::

    >>> driver("""{ table: individual }""")

    >>> driver({ 'column': "individual.code", 'type': "text" })

    >>> from rex.deploy import LinkFact
    >>> driver([LinkFact("individual", "mother", "individual", is_required=False),
    ...         LinkFact("individual", "father", "individual", is_required=False)])

    >>> driver.submit("""CREATE TABLE individual (id int4 NOT NULL);""")
    Traceback (most recent call last):
      ...
    Error: Got an error from the database driver:
        relation "individual" already exists
    While executing SQL:
        CREATE TABLE individual (id int4 NOT NULL);

Deploying an empty YAML input is no-op::

    >>> driver(""" """)

After manipulating the database with the driver, you need to commit or rollback
and close the driver connection::

    >>> driver.rollback()
    >>> driver.close()


Deploying application database
==============================

Use function ``deploy()`` to read and deploy the application schema from
``deploy.yaml`` files.  When there are no ``deploy.yaml``, ``deploy()``
does nothing::

    >>> from rex.core import SandboxPackage
    >>> from rex.deploy import deploy
    >>> sandbox = SandboxPackage()
    >>> deploy_demo = LatentRex(sandbox, 'rex.deploy', 'rex.db',
    ...                         db='pgsql:deploy_demo_cluster')

    >>> with deploy_demo:
    ...     deploy(logging=True)                        # doctest: +ELLIPSIS
    Nothing to deploy.
    Total time: ...

Normally, ``deploy()`` will read and deploy ``deploy.yaml`` files from
all packages::

    >>> sandbox.rewrite('/deploy.yaml', """
    ... table: individual
    ... """)
    >>> with deploy_demo:
    ...     deploy(logging=True)                        # doctest: +ELLIPSIS
    Deploying sandbox.
    CREATE TABLE "individual" ...
    Validating sandbox.
    Total time: ...

You can run ``deploy()`` in dry run mode, in which case any changes to
the database will be rolled back::

    >>> sandbox.rewrite('/deploy.yaml', """
    ... table: study
    ... """)
    >>> with deploy_demo:
    ...     deploy(logging=True, dry_run=True)          # doctest: +ELLIPSIS
    Deploying sandbox.
    CREATE TABLE "study" ...
    Validating sandbox.
    Rolling back changes (dry run).
    Total time: ...

Finally, we destroy the test database::

    >>> with deploy_demo:
    ...     get_cluster().drop()



