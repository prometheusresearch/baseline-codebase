#
# Copyright (c) 2013, Prometheus Research, LLC
#

from cogs import task, argument, option
from .common import make_rex, pair

@task
class PYTHON:
    """create Python shell with initialized Rex application.

    If IPython is available it will be used.

    Use option `--require` or setting `requirements` to specify additional
    packages to include with the application.

    Use option `--set` or setting `parameters` to specify configuration
    parameters of the application.
    """

    BANNER_TEMPLATE = """
    Rex application "%(app_name)s"
    """

    project = argument(str, default=None)
    require = option(None, str, default=[], plural=True,
            value_name="PACKAGE",
            hint="include an additional package")
    set = option(None, pair, default={}, plural=True,
            value_name="PARAM=VALUE",
            hint="set a configuration parameter")

    def __init__(self, project, require, set):
        self.project = project
        self.require = require
        self.set = set

    def __call__(self):
        set_list = dict(self.set)
        app = make_rex(self.project, self.require, set_list, False)
        banner = self.BANNER_TEMPLATE % {'app_name': self.project}
        namespace = {'app': app}
        with app:
            try:
                from IPython.terminal.embed import InteractiveShellEmbed
                sh = InteractiveShellEmbed(banner1=banner)
            except ImportError:
                from code import interact
                interact(banner, local=namespace)
            else:
                sh(global_ns={}, local_ns=namespace)
