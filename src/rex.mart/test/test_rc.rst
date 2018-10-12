*****************
Reference Counter
*****************

Set up the environment::

    >>> from rex.core import Rex
    >>> import sys; cluster = 'pgsql://:5433/mart' if hasattr(sys, 'MART_MULTICLUSTER_TEST') else None
    >>> rex = Rex('rex.mart_demo', mart_hosting_cluster=cluster)
    >>> rex.on()

    >>> from rex.mart import get_hosting_cluster
    >>> cluster = get_hosting_cluster()

    >>> from rex.mart import MartCreator, purge_mart, mart_getref, mart_incref, mart_decref

Create test marts::

    >>> mc = MartCreator('rctest', 'empty')
    >>> mart1 = mc()
    >>> mart2 = mc()

When a mart is created, its RC value is equal to 1::

    >>> mart_getref(cluster, mart1.name)
    1

In this case, purging the mart removes the mart database::

    >>> purge_mart(mart1.code)

    >>> cluster.exists(mart1.name)
    False

Change the RC value to 2::

    >>> mart_incref(cluster, mart2.name)
    2
    >>> mart_getref(cluster, mart2.name)
    2
    >>> mart_incref(cluster, mart2.name)
    3
    >>> mart_decref(cluster, mart2.name)
    2
    >>> mart_getref(cluster, mart2.name)
    2

Purging this mart decreases the RC value by 1::

    >>> purge_mart(mart2.code)

    >>> cluster.exists(mart2.name)
    True
    >>> mart_getref(cluster, mart2.name)
    1

When the RC value drops to 0, the mart database is removed::

    >>> mart_decref(cluster, mart2.name)
    0
    >>> cluster.exists(mart2.name)
    False



    >>> rex.off()

