#
# Copyright (c) 2016, Prometheus Research, LLC
#


"""
This package creates a hierarchical menu of URLs and URL handlers.
"""


from rex.core import Initialize
from .load import get_menu
from .route import PipeMenu
from .menu import Menu


class InitializeMenu(Initialize):

    def __call__(self):
        get_menu()


