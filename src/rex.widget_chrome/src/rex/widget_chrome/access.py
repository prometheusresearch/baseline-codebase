from rex.core import Initialize, get_settings, cached
from rex.web import route, Authorize
from rex.urlmap import Override
from rex.action.map import ActionRenderer
from rex.widget.map import WidgetRenderer


@cached
def access_map():
    access_map = {}
    for level1 in get_settings().menu:
        for item in level1.items:
            if item.access is not None:
                access_map[item.url] = item.access
    return access_map


class AccessOverride(Override):

    def __call__(self, path, spec):
        url = '%s:%s' % (self.package.name, path)
        access = access_map().get(url)
        if access is not None:
            return spec.__clone__(access=access)
        # TODO: set nobody to others automatically?
        return spec


class InitializeMenu(Initialize):

    def __call__(self):
        menu = get_settings().menu
        access_map = Authorize.mapped()
        print access_map.keys()
        for level1 in menu:
            for item in level1.items:
                handler = route(item.url)
                assert handler is not None, \
                       ('Cannot find handler for the URL: %s. '
                        'Check your "menu" setting.') % item.url
                #assert isinstance(handler, (ActionRenderer, WidgetRenderer)), \
                #       ('Wrong handler for the URL: %s. '
                #        'Check your "menu" setting.') % item.url
                access = access_map.get(item.access)
                assert access is not None, \
                       ('Permission "%s" for the URL: %s cannot be found. '
                        'Check your "menu" setting.') % (item.access, item.url)
