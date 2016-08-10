*****************
Reference Counter
*****************

Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()

    >>> from rex.deploy import get_cluster
    >>> cluster = get_cluster()

    >>> from rex.mart import MartCreator, purge_mart, mart_getref, mart_incref, mart_decref

Create test marts::

    >>> mc = MartCreator('rctest', 'empty')
    >>> mart1 = mc()
    >>> mart2 = mc()

When a mart is created, its RC value is equal to 1::

    >>> mart_getref(cluster, mart1.name)
    1L

In this case, purging the mart removes the mart database::

    >>> purge_mart(mart1.code)

    >>> cluster.exists(mart1.name)
    False

Change the RC value to 2::

    >>> mart_incref(cluster, mart2.name)
    2L
    >>> mart_getref(cluster, mart2.name)
    2L
    >>> mart_incref(cluster, mart2.name)
    3L
    >>> mart_decref(cluster, mart2.name)
    2L
    >>> mart_getref(cluster, mart2.name)
    2L

Purging this mart decreases the RC value by 1::

    >>> purge_mart(mart2.code)

    >>> cluster.exists(mart2.name)
    True
    >>> mart_getref(cluster, mart2.name)
    1L

When the RC value drops to 0, the mart database is removed::

    >>> mart_decref(cluster, mart2.name)
    0L
    >>> cluster.exists(mart2.name)
    False

    >>> rex.off()

