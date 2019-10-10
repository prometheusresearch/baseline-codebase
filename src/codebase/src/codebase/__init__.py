#
# Copyright (c) 2019, Prometheus Research, LLC
#

import sys
import os.path


_VERSION = None


def get_application_version():
    """
    Returns the version of the application image or environment that this
    program is executing in.

    :rtype: str
    """

    global _VERSION

    if _VERSION is None:
        ver_file = f'{sys.prefix}/APPLICATION_VERSION'
        if os.path.exists(ver_file):
            _VERSION = open(ver_file, 'r').read().strip()
        else:
            _VERSION = 'UNKNOWN'

    return _VERSION

