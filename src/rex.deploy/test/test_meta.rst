************
  Metadata
************

.. contents:: Table of Contents


Parsing and serializing metadata
================================

When input is not provided, metadata assumes all default values::

    >>> from rex.deploy import TableMeta

    >>> empty_meta = TableMeta.parse(None)
    >>> empty_meta
    TableMeta(Record(label=None, title=None, aliases=[]))
    >>> print(empty_meta.dump())
    None

Any unrecognized text is preserved::

    >>> garbage_meta = TableMeta.parse("""List of test subjects""")
    >>> garbage_meta
    TableMeta(Record(label=None, title=None, aliases=[]), extra='List of test subjects')
    >>> print(garbage_meta.dump())
    List of test subjects

    >>> garbage_meta.update(title="Test Subject")
    True
    >>> garbage_meta
    TableMeta(Record(label=None, title='Test Subject', aliases=[]), extra='List of test subjects')
    >>> print(garbage_meta.dump())
    ---
    title: Test Subject
    --- List of test subjects
    ...
    <BLANKLINE>

Preserved text is stored in an extra document::

    >>> extra_meta = TableMeta.parse(garbage_meta.dump())
    >>> extra_meta
    TableMeta(Record(label=None, title=u'Test Subject', aliases=[]), extra=['List of test subjects'])
    >>> print(extra_meta.dump())
    ---
    title: Test Subject
    --- List of test subjects
    ...
    <BLANKLINE>

Ill-formed and invalid YAML documents are ignored::

    >>> TableMeta.parse("--- *")
    TableMeta(Record(label=None, title=None, aliases=[]), extra='--- *')

    >>> TableMeta.parse("--- .")
    TableMeta(Record(label=None, title=None, aliases=[]), extra='--- .')



