#
# Copyright (c) 2015, Prometheus Research, LLC
#


import re
import sys

from contextlib import contextmanager

from rex.core import Error, get_settings, Record


__all__ = (
    'extract_htsql_statements',
    'guarded',
    'RESTR_SAFE_TOKEN',
    'make_safe_token',
    'record_to_dict',
    'REQUIRED',
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


def make_safe_token(token, trim=True):
    """
    Massages the given token so that it is safe for use as the name of an
    object in the database.

    :param token: the token to massage
    :type token: str
    :rtype: str
    """

    safe_token = unicode(token).lower().replace('-', '_')

    if safe_token == 'id':
        # This is a name that causes issues with lower level tools.
        safe_token = u'id_'

    if not RE_SAFE_TOKEN.match(safe_token):
        safe_token = RE_CLEAN_TOKEN.sub(u'', safe_token)
        if not trim:
            return safe_token
        while not RE_SAFE_TOKEN.match(safe_token):
            safe_token = safe_token[1:]
            if not safe_token:
                raise Error('Cannot make a safe token out of "%s"' % (token,))
    return safe_token[:get_settings().mart_max_name_length]


def record_to_dict(rec):
    """
    Recursively converts a rex.core.Record structure into regular dict obkects.

    :param rec: the Record to convert
    :type rec: rex.core.Record
    :rtype: dict
    """

    result = {}

    if isinstance(rec, Record):
        all_fields = rec._fields
    elif isinstance(rec, dict):
        all_fields = rec.keys()

    for field in all_fields:
        result[field] = rec[field]
        if isinstance(result[field], (dict, Record)):
            result[field] = record_to_dict(result[field])
        elif isinstance(result[field], list):
            for i in range(len(result[field])):
                if isinstance(result[field][i], (dict, Record)):
                    result[field][i] = record_to_dict(result[field][i])

    return result


class RequiredType(object):
    def __repr__(self):
        return 'REQUIRED'


#: A flag value that indicates a parameter/property is required.
REQUIRED = RequiredType()

