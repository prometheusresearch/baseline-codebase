#
# Copyright (c) 2015, Prometheus Research, LLC
#


import sys

from contextlib import contextmanager

from rex.core import Error


__all__ = (
    'extract_htsql_statements',
    'guarded',
)


def extract_htsql_statements(script):
    """
    Separates an HTSQL script into a list of individual HTSQL statements.

    Statements must start at the beginning of a line. If a statement is spread
    across multiple lines, all lines after the first must be indented.

    Lines that start with a ``#`` are excluded.

    :param script: the script to parse
    :type script: str
    :rtype: list
    """

    blocks = []
    lines = []

    for idx, line in enumerate(script.splitlines()):
        line = line.rstrip()

        if not line or line.startswith('#'):
            # Empty line or comment; skip it
            continue

        elif line == line.lstrip():
            # Start of a new statement
            if lines:
                blocks.append(lines)
            lines = [line]

        else:
            # Indented line; part of a block
            if not lines:
                raise Error(
                    'Got unexpected indentation, line %s' % (
                        idx + 1,
                    )
                )
            lines.append(line)

    if lines:
        blocks.append(lines)

    statements = [
        '\n'.join(block)
        for block in blocks
    ]

    return statements


@contextmanager
def guarded(msg, payload=None):
    """
    Behaves much like ``rex.core.guard()``, with the added functionality that
    any exceptions that are not based on ``rex.core.Error`` are coerced into
    that type.
    """

    try:
        yield

    except Error as exc:
        exc.wrap(msg, payload)
        raise

    except Exception as exc:
        new_exc = Error(unicode(exc))
        new_exc.wrap(msg, payload)
        raise Error, new_exc, sys.exc_info()[2]

