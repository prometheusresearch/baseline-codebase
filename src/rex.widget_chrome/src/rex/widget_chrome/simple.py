
from rex.core import RecordVal, AnyVal, StrVal, MapVal, SeqVal, MaybeVal, \
                     BoolVal, ChoiceVal, Record
from rex.core import get_packages, cached, get_settings
from rex.web import get_routes, authorize, url_for
from rex.db import get_db, Query

from rex.widget import (Chrome,
    Widget, NullWidget, WidgetVal,
    Field, URLVal, computed_field, WidgetComposition)


class SimpleChrome(Chrome):

    js_type = 'rex-widget-chrome/lib/SimpleChrome'

    @computed_field
    def application_banner(self, request):
        return get_settings().application_banner

    @computed_field
    def application_title(self, request):
        return get_settings().application_title

    @computed_field
    def application_logout_url(self, request):
        return get_settings().application_logout_url

    @computed_field
    def application_header_bgcolor(self, request):
        return get_settings().application_header_bgcolor

    @computed_field
    def application_header_bgcolor_hover(self, request):
        return get_settings().application_header_bgcolor_hover

    @computed_field
    def application_header_textcolor(self, request):
        return get_settings().application_header_textcolor

    @computed_field
    def application_header_textcolor_hover(self, request):
        return get_settings().application_header_textcolor_hover

    @computed_field
    def site_root(self, request):
        root_package = list(get_packages())[0]
        return url_for(request, '%s:/' % root_package.name)

    @computed_field
    def username(self, request):
        query = get_settings().username_query
        with get_db():
            return Query(query).produce().data or request.remote_user

    @computed_field
    def user_profile_url(self, request):
        url = get_settings().user_profile_url
        return url_for(request, url) if url is not None else None

    @computed_field
    def personal_menu_links(self, request):
        links = []
        for link in get_settings().personal_menu_links:
            links.append({
                'label': link.label,
                'url': url_for(request, link.url),
            })

        if get_settings().application_logout_url:
            links.append({
                'label': 'Logout',
                'url': get_settings().application_logout_url,
            })
        return links

    @computed_field
    def menu(self, req):
        Item = Record.make('Item', ('title', 'url'))
        menu = get_settings().menu
        ret = []
        for item1 in menu:
            ret.append({
                'id': item1.title.replace(' ', '-'),
                'title': item1.title,
                'permitted': True,
                'items': []
            })
            items = ret[-1]['items']
            for item2 in item1.items:
                if isinstance(item2, (str, unicode)):
                    item2 = Item(title=None, url=item2)
                handler = get_handler(item2.url)
                assert handler is not None, 'Cannot find URL: %s' % item2.url
                title = item2.title or get_title(handler) or 'Untitled'
                items.append({
                    'id': item2.url,
                    'title': title,
                    'permitted': authorize(req, handler),
                    'url': url_for(req, item2.url)
                })
            ret[-1]['permitted'] = any([i['permitted']
                                        for i in ret[-1]['items']])
        return ret

def get_title(handler):
    if hasattr(handler, 'title'):
        return handler.title
    if hasattr(handler, 'action'):
        return handler.action.title

def get_handler(url):
    package_name, url = url.split(':', 1)
    package = get_packages().get(package_name)
    routes = get_routes(package)
    for location, handler in iter_pathmap_tree(routes.tree):
        if location == url or location + '/' == url:
            return handler
    return None


def iter_pathmap_tree(tree, _prefix=''):
    """ Iterate over :mod:`rex.web` routing tree and yield (path, handler)
    pairs.

    TODO: this function belongs to rex.web package
    """
    if not _prefix.endswith('/'):
        _prefix += '/'
    for k, v in tree.items():
        k = k or ''
        if not isinstance(k, str):
            continue
        prefix = '%s%s' % (_prefix, k)
        if isinstance(v, dict):
            for seg in iter_pathmap_tree(v, _prefix=prefix):
                yield seg
        else:
            if len(prefix) > 1 and prefix.endswith('/'):
                prefix = prefix[:-1]
            for _, handler in v:
                yield prefix, handler
