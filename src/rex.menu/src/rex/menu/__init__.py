#
# Copyright (c) 2016, Prometheus Research, LLC
#


"""
This package organizes a hierarchical catalog of application pages.
"""


from rex.core import Initialize
from .load import get_menu, MenuItem
from .route import PipeMenu
from .menu import Menu


class InitializeMenu(Initialize):

    def __call__(self):
        # Make sure we can parse `menu.yaml`.
        get_menu()


