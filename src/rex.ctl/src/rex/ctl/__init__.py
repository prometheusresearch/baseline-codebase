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

# Enable `serve` and `wsgi` tasks (only when `rex.web` is installed).
try:
    import rex.web
except ImportError:
    pass
else:
    import serve
    import wsgi


