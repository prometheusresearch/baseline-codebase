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

Query ``study.code`` is constructed by the following combinator::

    >>> from rex.query import (
    ...         SQLSchema, SQLTable, SQLColumn, SQLKey, SQLTablePipe, SQLColumnPipe, SQLLinkPipe,
    ...         AggregatePipe, DataSetPipe, text_t, integer_t, count_sig)

    >>> public_ns = SQLSchema(u'public')
    >>> study_t = SQLTable(public_ns, u'study')
    >>> study_code_c = SQLColumn(study_t, u'code')

    >>> study_pipe = SQLTablePipe(study_t)
    >>> study_code_pipe = SQLColumnPipe(study_code_c, text_t)
    >>> study_to_code_pipe = (study_pipe >> study_code_pipe)

    >>> print study_to_code_pipe    # doctest: +NORMALIZE_WHITESPACE
    (SQLTablePipe(SQLTable(schema=SQLSchema(name=u'public'), name=u'study'))
     >>
     SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'study'), name=u'code'),
                   AtomicDomain(u'Text')))
    >>> print study_to_code_pipe.input
    Input(AtomicDomain(u'Void'))
    >>> print study_to_code_pipe.output
    Output(AtomicDomain(u'Text'), optional=True, plural=True)
    >>> print study_to_code_pipe()
    Column([0, 3], [u'fos', u'asdl', u'lol'])

``study:select(code, title)``::

    >>> study_title_c = SQLColumn(study_t, u'title')

    >>> study_title_pipe = SQLColumnPipe(study_title_c, text_t)
    >>> study_with_code_title_pipe = \
    ...     study_pipe >> DataSetPipe((study_code_pipe, study_title_pipe))

    >>> print study_with_code_title_pipe                        # doctest: +NORMALIZE_WHITESPACE
    (SQLTablePipe(SQLTable(schema=SQLSchema(name=u'public'), name=u'study'))
     >>
     DataSetPipe((SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'study'), name=u'code'), AtomicDomain(u'Text')),
                  SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'study'), name=u'title'), AtomicDomain(u'Text')))))

    >>> print study_with_code_title_pipe.output                 # doctest: +NORMALIZE_WHITESPACE
    Output(DataSetDomain((Output(AtomicDomain(u'Text')),
                          Output(AtomicDomain(u'Text')))),
                         optional=True, plural=True)

    >>> print study_with_code_title_pipe()                      # doctest: +NORMALIZE_WHITESPACE
    Column([0, 3], DataSet([Column([0, 1, 2, 3], [u'fos', u'asdl', u'lol']),
                            Column([0, 1, 2, 2], [u'Family Obesity Study', u'Autism Spectrum Disorder Lab'])], length=3))

``study:select(code, title, count(protocol))``::

    >>> study_key = SQLKey(study_t, (u'id',))
    >>> protocol_t = SQLTable(public_ns, u'participation')
    >>> protocol_study_key = SQLKey(protocol_t, (u'study_id',))

    >>> study_protocol_pipe = SQLLinkPipe(study_key, protocol_study_key, optional=False, plural=False)
    >>> count_study_protocol_pipe = AggregatePipe(count_sig, (study_protocol_pipe,))
    >>> study_with_code_title_count_protocol_pipe = \
    ...     study_pipe >> DataSetPipe((study_code_pipe, study_title_pipe, count_study_protocol_pipe))

    >>> print study_with_code_title_count_protocol_pipe         # doctest: +NORMALIZE_WHITESPACE
    (SQLTablePipe(SQLTable(schema=SQLSchema(name=u'public'), name=u'study'))
     >>
     DataSetPipe((SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'study'), name=u'code'), AtomicDomain(u'Text')),
                  SQLColumnPipe(SQLColumn(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'study'), name=u'title'), AtomicDomain(u'Text')),
                  AggregatePipe(Signature(name=u'count', domains=(AnyDomain(),), range=AtomicDomain(u'Integer')),
                                (SQLLinkPipe(SQLKey(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'study'), names=(u'id',)),
                                             SQLKey(table=SQLTable(schema=SQLSchema(name=u'public'), name=u'participation'), names=(u'study_id',))),)))))

    >>> print study_with_code_title_count_protocol_pipe.output  # doctest: +NORMALIZE_WHITESPACE
    Output(DataSetDomain((Output(AtomicDomain(u'Text')),
                          Output(AtomicDomain(u'Text')),
                          Output(AtomicDomain(u'Integer')))),
                         optional=True, plural=True)



