*********************
  Query Combinators
*********************

.. contents:: Table of Contents


Creating Combinators
====================

We start with initializing the application::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.query_demo')
    >>> demo.on()

Query ``region.name`` is constructed by the following combinator::

    >>> from rex.query import (
    ...         SQLSchema, SQLTable, SQLColumn, SQLKey, SQLTablePipe, SQLColumnPipe, SQLLinkPipe,
    ...         AggregatePipe, DataSetPipe, text_t, integer_t, count_sig)

    >>> public_ns = SQLSchema(u'public')
    >>> region_t = SQLTable(public_ns, u'region')
    >>> region_name_c = SQLColumn(region_t, u'name')

    >>> region_pipe = SQLTablePipe(region_t)
    >>> region_name_pipe = SQLColumnPipe(region_name_c, text_t)
    >>> region_to_name_pipe = (region_pipe >> region_name_pipe)

    >>> print region_to_name_pipe    # doctest: +NORMALIZE_WHITESPACE
    (SQLTablePipe(SQLTable(schema=SQLSchema(name=u'public'), name=u'region'))
     >>
     SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'region'), name=u'name'),
                   AtomicDomain(u'Text')))
    >>> print region_to_name_pipe.input
    Input(AtomicDomain(u'Void'))
    >>> print region_to_name_pipe.output
    Output(AtomicDomain(u'Text'), optional=True, plural=True)
    >>> print region_to_name_pipe()
    Column([0, 5], [u'AFRICA', u'AMERICA', u'ASIA', u'EUROPE', u'MIDDLE EAST'])

``region:select(name, comment)``::

    >>> region_comment_c = SQLColumn(region_t, u'comment')

    >>> region_comment_pipe = SQLColumnPipe(region_comment_c, text_t)
    >>> region_with_name_comment_pipe = \
    ...     region_pipe >> DataSetPipe((region_name_pipe, region_comment_pipe))

    >>> print region_with_name_comment_pipe                        # doctest: +NORMALIZE_WHITESPACE
    (SQLTablePipe(SQLTable(schema=SQLSchema(name=u'public'), name=u'region'))
     >>
     DataSetPipe((SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'region'), name=u'name'), AtomicDomain(u'Text')),
                  SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'region'), name=u'comment'), AtomicDomain(u'Text')))))

    >>> print region_with_name_comment_pipe.output                 # doctest: +NORMALIZE_WHITESPACE
    Output(DataSetDomain((Output(AtomicDomain(u'Text')),
                          Output(AtomicDomain(u'Text')))),
                         optional=True, plural=True)

    >>> print region_with_name_comment_pipe()                      # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    Column([0, 5], DataSet([Column([0, 1, 2, 3, 4, 5], [u'AFRICA', u'AMERICA', ...]),
                            Column([0, 1, 2, 3, 4, 5], [u'lar ...', u'hs ...', ...])], length=5))

``region:select(name, comment, count(nation))``::

    >>> region_key = SQLKey(region_t, (u'id',))
    >>> nation_t = SQLTable(public_ns, u'participation')
    >>> nation_region_key = SQLKey(nation_t, (u'region_id',))

    >>> region_nation_pipe = SQLLinkPipe(region_key, nation_region_key, optional=False, plural=False)
    >>> count_region_nation_pipe = AggregatePipe(count_sig, (region_nation_pipe,))
    >>> region_with_name_comment_count_nation_pipe = \
    ...     region_pipe >> DataSetPipe((region_name_pipe, region_comment_pipe, count_region_nation_pipe))

    >>> print region_with_name_comment_count_nation_pipe         # doctest: +NORMALIZE_WHITESPACE
    (SQLTablePipe(SQLTable(schema=SQLSchema(name=u'public'), name=u'region'))
     >>
     DataSetPipe((SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'region'), name=u'name'), AtomicDomain(u'Text')),
                  SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'region'), name=u'comment'), AtomicDomain(u'Text')),
                  AggregatePipe(Signature(name=u'count', domains=(AnyDomain(),), range=AtomicDomain(u'Integer')),
                                (SQLLinkPipe(SQLKey(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'region'), names=(u'id',)),
                                             SQLKey(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'participation'), names=(u'region_id',))),)))))

    >>> print region_with_name_comment_count_nation_pipe.output  # doctest: +NORMALIZE_WHITESPACE
    Output(DataSetDomain((Output(AtomicDomain(u'Text')),
                          Output(AtomicDomain(u'Text')),
                          Output(AtomicDomain(u'Integer')))),
                         optional=True, plural=True)



