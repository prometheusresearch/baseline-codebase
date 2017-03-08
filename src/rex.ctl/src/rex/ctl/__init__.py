#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
This package provides ``rex`` command-line utility.
"""


from .bridge import (
        env, task, default_task, setting, argument, option, Failure,
        Environment, cp, mv, rm, rmtree, mktree, exe, sh, pipe, COLORS,
        colorize, log, debug, warn, fail, prompt, run, main, Task, Global,
        Topic)
from .core import (
        RexTask, ProjectGlobal, RequirementsGlobal, ParametersGlobal,
        SentryGlobal, PackagesTask, SettingsTask, PyShellTask,
        ConfigurationTopic, load_rex)
from .ctl import Ctl, ctl


