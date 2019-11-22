**********
Connection
**********


Set up the environment::

    >>> from rex.core import Rex
    >>> import sys; cluster = 'pgsql://:5433/mart' if hasattr(sys, 'MART_MULTICLUSTER_TEST') else None
    >>> rex = Rex('rex.mart_demo', mart_hosting_cluster=cluster)
    >>> rex.on()
    >>> from rex.mart import MartCreator


get_latest_mart_db
==================

This function will identify the most-recently created mart for the given
definition and return a connection to it::

    >>> from rex.mart import get_latest_mart_db

    >>> mc = MartCreator('test', 'empty')
    >>> marts = [mc() for x in range(3)]

    >>> latest = get_latest_mart_db('empty')

    >>> latest.htsql.db.database == marts[-1].name
    True




    >>> rex.off()

