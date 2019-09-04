#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
This package provides ``rex`` command-line utility.
"""


from .core import (
        env, argument, option, Failure, Environment, COLORS, colorize, log,
        debug, warn, fail, prompt, run, main, Task, Global, Topic)
from .fs import cp, mv, rm, rmtree, mktree, exe, sh, pipe
from .std import (
        HelpTask, UsageTask, RexTask, DebugGlobal, ConfigGlobal, ProjectGlobal,
        RequirementsGlobal, ParametersGlobal, SentryGlobal, PackagesTask,
        SettingsTask, PyShellTask, ConfigurationTopic, load_rex)
from .ctl import Ctl, ctl


