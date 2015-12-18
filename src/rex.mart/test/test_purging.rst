*******
Purging
*******


Set up the environment::

    >>> from webob import Request
    >>> from pprint import pprint
    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()

    >>> from rex.mart import MartCreator, purge_mart

    >>> mc = MartCreator('purgetest', 'empty')
    >>> _ = mc()
    >>> empty_mart = mc()
    >>> mc = MartCreator('purgetest', 'some_data')
    >>> _ = mc(); _ = mc()
    >>> some_data_mart = mc()
    >>> mc = MartCreator('otheruser', 'empty')
    >>> empty_mart_other = mc()
    >>> mc = MartCreator('otheruser', 'some_data')
    >>> some_data_mart_other = mc()
    >>> mc = MartCreator('purgetest', 'just_deploy')
    >>> _ = mc()


purge_mart
==========

The purge_mart() function will delete a Mart as well as its associated
inventory record::

    >>> marts = []
    >>> mc = MartCreator('purgetest', 'empty')
    >>> marts.append(mc())
    >>> marts.append(mc())
    >>> mc = MartCreator('purgetest', 'some_data')
    >>> marts.append(mc())

    >>> purge_mart(marts[0].code)
    >>> purge_mart(marts[1].code)
    >>> purge_mart(marts[2].code)

    >>> purge_mart(marts[0].code)




    >>> rex.off()

