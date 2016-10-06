******
Quotas
******


Set up the environment::

    >>> from rex.core import Rex
    >>> import sys; cluster = 'pgsql://:5433/mart' if hasattr(sys, 'MART_MULTICLUSTER_TEST') else None
    >>> rex = Rex('rex.mart_demo', mart_max_marts_per_owner=5, mart_hosting_cluster=cluster)
    >>> rex.on()
    >>> from rex.mart import MartCreator, get_management_db

    >>> def count_marts(owner):
    ...     data = get_management_db().produce('/rexmart_inventory.filter(owner=$owner)^definition{definition, count(^)}', owner=owner)
    ...     print ', '.join(['%s: %s' % (rec[0], rec[1]) for rec in data])


    >>> mc1 = MartCreator('quotaguy', 'empty')
    >>> mart = mc1()
    >>> mart = mc1(); mart.pinned = True
    >>> mart = mc1(); mart.pinned = True
    >>> count_marts('quotaguy')
    empty: 3

    >>> mc2 = MartCreator('quotaguy', 'some_data')
    >>> mart = mc2()
    >>> mart = mc2(); mart.pinned = True
    >>> count_marts('quotaguy')
    empty: 3, some_data: 2

    >>> mart = mc2(); mart.pinned = True
    >>> count_marts('quotaguy')
    empty: 2, some_data: 3

    >>> mart = mc2(); mart.pinned = True
    >>> count_marts('quotaguy')
    empty: 2, some_data: 3

    >>> mart = mc2()
    Traceback (most recent call last):
        ...
    Error: Creating a "some_data" Mart for "quotaguy" would exceed their quota

    >>> count_marts('quotaguy')
    empty: 2, some_data: 3


    >>> mc3 = MartCreator('quotaguy', 'some_more_data')
    >>> mc3()
    Traceback (most recent call last):
        ...
    Error: Creating a "some_more_data" Mart for "quotaguy" would exceed their quota



    >>> rex.off()

