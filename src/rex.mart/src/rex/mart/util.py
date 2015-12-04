#
# Copyright (c) 2015, Prometheus Research, LLC
#


import re
import sys

from contextlib import contextmanager

from rex.core import Error


__all__ = (
    'extract_htsql_statements',
    'guarded',
    'RESTR_SAFE_TOKEN',
    'make_safe_token',
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

    :param msg: the message to wrap any exceptions raised with
    :type msg: str
    :param payload: the additional details to include in the wrapping
    :type payload: str
    """

    try:
        yield

    except Error as exc:
        exc.wrap(msg, payload)
        raise

    except Exception as exc:
        new_exc = Error(unicode(exc))
        new_exc.wrap(msg, payload)
        raise Error, new_exc, sys.exc_info()[2]  # noqa


RESTR_SAFE_TOKEN = r'^[a-z_][0-9a-z_]*$'
RE_SAFE_TOKEN = re.compile(RESTR_SAFE_TOKEN)
RE_CLEAN_TOKEN = re.compile(r'[^a-z0-9_]')


def make_safe_token(token):
    """
    Massages the given token so that it is safe for use as the name of an
    object in the database.

    :param token: the token to massage
    :type token: str
    :rtype: str
    """

    safe_token = unicode(token).lower()
    if not RE_SAFE_TOKEN.match(safe_token):
        safe_token = RE_CLEAN_TOKEN.sub(u'', safe_token)
        while not RE_SAFE_TOKEN.match(safe_token):
            safe_token = safe_token[1:]
            if not safe_token:
                raise Error('Cannot make a safe token out of "%s"' % (token,))
    return safe_token

