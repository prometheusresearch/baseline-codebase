#
# Copyright (c) 2020, Prometheus Research, LLC
#

from rex.attach import get_storage
from rex.db import get_db


def save_file(name, content):
    """
    Saves a file in the ``rex.attach`` storage and records its existence in the
    ``file`` table.

    Returns a string containing the file's ``rex.attach`` handle.

    :param name: The name of the file to be saved.
    :type name: str
    :param content: The file's contents.
    :type content: str or file-like object
    :rtype: str
    """

    handle = get_storage().add(name, content)
    rec = get_db().produce(
        '''
        /insert(file := {
            handle := $handle,
        })
        ''',
        handle=handle,
    )
    return str(rec.data)

