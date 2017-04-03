#
# Copyright (c) 2017, Prometheus Research, LLC
#


"""
The ``rex_tabular_import`` HTSQL addon adds ability to submit the
tabular_import asynctask
"""

from htsql.core.addon import Addon


from .submit_task import *

class RexTabularImportAddon(Addon):

    name = 'rex_tabular_import'
    hint = 'Tabular Import specific commands'
    help = __doc__
