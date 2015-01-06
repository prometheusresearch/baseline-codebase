#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
This package provides `rex` command-line utility.
"""


from cogs.core import env
from cogs.run import main
import sys
import os.path


env.shell.set(name="Rex",
              description="""Command-line administration utility"""
                          """ for the RexDB platform""",
              local_package='rex.local',
              entry_point='rex.ctl',
              config_name='rex.yaml',
              config_dirs=['/etc',
                           os.path.join(sys.prefix, '/etc'),
                           os.path.expanduser('~/.rex'),
                           os.path.abspath('.')]),


# Enable settings.
import common

# Enable package and configuration help.
import describe

from . import python

# Enable `serve` and `wsgi` tasks (only when `rex.web` is installed).
try:
    import rex.web
except ImportError:
    pass
else:
    from . import serve, wsgi, daemon

# Enable `shell` task if `rex.db` is installed.
try:
    import rex.db
except ImportError:
    pass
else:
    from . import shell, query, graphdb

# Enable `deploy` and other database management tasks if `rex.deploy`
# is installed.
try:
    import rex.deploy
except ImportError:
    pass
else:
    from . import deploy


