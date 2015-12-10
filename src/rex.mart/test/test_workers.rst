********************
Asynchronous Workers
********************


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()


rexmart_create
==============

The ``rexmart_create`` task accepts the same properties as a RunList entry
and creates a Mart according to that input::

    >>> from rex.mart import MartCreateWorker
    >>> MartCreateWorker is None
    False
    >>> worker = MartCreateWorker()

    >>> payload = {'owner': 'async', 'definition': 'empty'}
    >>> worker.process(payload)  # doctest: +ELLIPSIS
    INFO:MartCreateWorker:Mart creation began: ...
    INFO:MartCreateWorker:Creating database: mart_empty_...
    INFO:MartCreateWorker:Executing Post-Deployment ETL...
    INFO:MartCreateWorker:...ETL complete
    INFO:MartCreateWorker:Executing Post-Assessment ETL...
    INFO:MartCreateWorker:...ETL complete
    INFO:MartCreateWorker:Mart creation complete: ...
    INFO:MartCreateWorker:Mart creation duration: ...

    >>> payload = {'owner': 'async'}
    >>> worker.process(payload)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        definition

    >>> payload = {'definition': 'empty'}
    >>> worker.process(payload)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        owner



    >>> rex.off()

