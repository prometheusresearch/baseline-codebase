*********
Core APIs
*********


Set up the environment::

    >>> from rex.asynctask import get_transport
    >>> from rex.core import Rex
    >>> rex = Rex('rex.asynctask_demo')
    >>> rex.on()


get_transport
=============

The ``get_transport()`` function will retrieve the AsyncTransport
implementation for the specified URI, or for the URI in the
``asynctask_transport`` setting if none is passed::

    >>> get_transport()
    PostgresAsyncTransport(localhost/asynctask_demo)

    >>> get_transport('pgsql:asynctask_demo?master_lock_id=999')
    PostgresAsyncTransport(localhost/asynctask_demo)

    >>> get_transport('localmem://')
    LocalMemoryAsyncTransport


It complains if the transport URI does not have a recognized schema::

    >>> get_transport('mysql:some_database')
    Traceback (most recent call last):
        ...
    ValueError: "mysql:some_database" does not resolve to a known AsyncTransport


    >>> rex.off()

