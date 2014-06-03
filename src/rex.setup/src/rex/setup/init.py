#
# Copyright (c) 2012-2014, Prometheus Research, LLC
#


import re
import distutils.errors


def check_init(dist, attr, value):
    # Verify that the value is a valid module name.
    if not isinstance(value, str) and \
            re.match(r'^[A-Za-z_][0-9A-Za-z_]*'
                     r'(?:\.[A-Za-z_][0-9A-Za-z_]*)*$', value):
        raise distutils.errors.DistutilsSetupError(
                "%s %r is not a valid module name" % (attr, value))


def write_init(cmd, basename, filename):
    # Write `rex_init` parameter to `*.egg-info/rex_init.txt`.
    module = cmd.distribution.rex_init
    cmd.write_or_delete_file("rex_init", filename, module)


