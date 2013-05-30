*******************
  Error reporting
*******************

.. contents:: Table of Contents


``Error``
=========

Rex API should use ``rex.core.Error`` and its subclasses for error reporting.
The exception constructor takes the error message and optional payload::

    >>> from rex.core import Error

    >>> raise Error("Got no money!")
    Traceback (most recent call last):
      ...
    Error: Got no money!

    >>> raise Error("Found no product:", "beer")
    Traceback (most recent call last):
      ...
    Error: Found no product:
        beer

The error may contain multiple paragraphs::

    >>> product = "beer"
    >>> where = "refrigerator #%s" % 3
    >>> try:
    ...     raise Error("Found no product:", product)
    ... except Error as error:
    ...     error.wrap("While looking in:", where)
    ...     raise
    Traceback (most recent call last):
      ...
    Error: Found no product:
        beer
    While looking in:
        refrigerator #3

    >>> error
    Error('Found no product:', 'beer').wrap('While looking in:', 'refrigerator #3')
    >>> error.paragraphs
    [Paragraph('Found no product:', 'beer'), Paragraph('While looking in:', 'refrigerator #3')]

Errors could be rendered in HTML::

    >>> print error.__html__()
    Found no product:<br />
    <pre>beer</pre><br />
    While looking in:<br />
    <pre>refrigerator #3</pre>


``guard``
=========

``guard`` context manager adds a paragraph to all escaping errors::

    >>> from rex.core import guard

    >>> with guard("While looking in:", where):
    ...     raise Error("Found no product:", product)
    Traceback (most recent call last):
      ...
    Error: Found no product:
        beer
    While looking in:
        refrigerator #3


