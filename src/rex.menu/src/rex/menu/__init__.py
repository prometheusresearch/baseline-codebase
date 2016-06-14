#
# Copyright (c) 2016, Prometheus Research, LLC
#


"""
This package creates a hierarchical menu of URLs and URL handlers.
"""


from rex.core import Initialize
from .load import load_menu
from .route import get_menu_map


class InitializeMenu(Initialize):

    def __call__(self):
        get_menu_map()


