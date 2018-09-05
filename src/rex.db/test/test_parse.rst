*****************
  Parsing HTSQL
*****************

.. contents:: Table of Contents


Validating HTSQL
================

The ``rex.db`` module provides a specialized validator for parsing HTSQL
queries.  It accepts a valid HTSQL expression and returns a parsed syntax tree::

    >>> from rex.db import SyntaxVal

    >>> htsql_val = SyntaxVal()
    >>> syntax = htsql_val("count(department)")

    >>> syntax
    <FunctionSyntax count(department)>

When the validator is given a syntax tree, it passes it through::

    >>> htsql_val(syntax)
    <FunctionSyntax count(department)>

Ill-formed HTSQL expressions cause an error::

    >>> htsql_val("count(department")
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse an HTSQL expression:
        Got unexpected end of input
        While parsing:
            count(department
                            ^

The validator can also parse HTSQL expressions in YAML documents::

    >>> htsql_val.parse("'count(department)'")
    <FunctionSyntax count(department)>

It is possible to specify which grammar rule the parser expects.  For example,
we can configure the validator to reject HTSQL commands::

    >>> expr_val = SyntaxVal('flow_pipe')

    >>> expr_val("count(department)")
    <FunctionSyntax count(department)>

You can see that this validator cannot an HTSQL segment while a regular
validator can::

    >>> htsql_val("/employee/:truncate")
    <PipeSyntax /employee/:truncate>

    >>> expr_val("/employee/:truncate")
    Traceback (most recent call last):
      ...
    rex.core.Error: Failed to parse an HTSQL expression:
        Got unexpected input
        While parsing:
            /employee/:truncate
                     ^

Parsing HTSQL
=============

Several functions are available to parse HTSQL directly::

    >>> from rex.db import decode_htsql, scan_htsql, parse_htsql

``decode_htsql`` decodes %-encoded HTSQL expressions::

    >>> decode_htsql("%2Femployee")
    '/employee'

``scan_htsql`` converts an HTSQL expression to a list of tokens::

    >>> scan_htsql("/employee")
    [<Token `/`:%2F>, <Token %NAME:employee>, <Token $>]

Similarly, you can use ``parse_htsql`` to convert an HTSQL expression to HTSQL
syntax tree::

    >>> parse_htsql("/employee")
    <CollectSyntax /employee>


