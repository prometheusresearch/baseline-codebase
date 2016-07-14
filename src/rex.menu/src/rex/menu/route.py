#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import autoreload
from rex.web import Pipe, PathMap
from .load import get_menu
from webob.exc import HTTPMovedPermanently


class PipeMenu(Pipe):
    # Handles HTTP requests to menu resources.

    priority = 'menu'
    after = ['error', 'transaction', 'i18n']
    before = ['routing']

    def __call__(self, req):
        menu = get_menu()
        handle = menu.route.get(req.path_info)
        if handle is None and menu.route.completes(req.path_info):
            return HTTPMovedPermanently(add_slash=True)
        return (handle or self.handle)(req)


