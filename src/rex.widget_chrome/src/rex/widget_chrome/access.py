from rex.core import Initialize, get_settings, cached, get_packages
from rex.web import route, Authorize
from rex.urlmap import Override
from rex.action.map import ActionRenderer
from rex.widget.map import WidgetRenderer
from .url import is_external


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
        for level1 in menu:
            for item in level1.items:
                if is_external(item.url):
                    continue
                handler = route(item.url)
                assert handler is not None or self.is_static_file(item.url), \
                       ('Cannot find handler for the URL: %s. '
                        'Check your "menu" setting.') % item.url
                access = access_map.get(item.access)
                assert access is not None, \
                       ('Permission "%s" for the URL: %s cannot be found. '
                        'Check your "menu" setting.') % (item.access, item.url)

    def is_static_file(self, url):
        package_name, file = url.split(':', 1)
        package = get_packages()[package_name]
        return package.exists('/www' + file)
