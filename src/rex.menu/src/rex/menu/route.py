#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import autoreload
from rex.web import Pipe, PathMap
from .load import LoadMenu


class PipeMenu(Pipe):

    priority = 'menu'
    after = 'transaction'
    before = 'routing'

    def __call__(self, req):
        route = get_menu_map()
        handle = route.get(req.path_info)
        return (handle or self.handle)(req)


@autoreload
def get_menu_map(open=open):
    load_menu = LoadMenu(open=open)
    bar = load_menu()
    map = PathMap()
    for menu in bar:
        for item in menu:
            for mask in item.path_masks():
                map.add(mask, item)
    return map


