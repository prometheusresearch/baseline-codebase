*******************
  Parsing Queries
*******************

.. contents:: Table of Contents


Query Validator
===============

We can use the query validator to parse queries in JSON format.

We start with creating an instance of ``QueryVal``::

    >>> from rex.query import QueryVal

    >>> query_val = QueryVal()

Next, we parse the query ``individual.code`` expressed in JSON form::

    >>> q = query_val(
    ...     [".", ["navigate", "individual"], ["navigate", "code"]])

We get an object that represents a parsed syntax tree::

    >>> q
    Query(ApplySyntax(u'.', [ApplySyntax(u'navigate', [LiteralSyntax(u'individual')]), ApplySyntax(u'navigate', [LiteralSyntax(u'code')])]))

We can also see the query in text notation::

    >>> print(q)
    individual.code



