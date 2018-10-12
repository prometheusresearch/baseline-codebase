from cached_property import cached_property

from rex.db import Query, get_db
from rex.web import route, url_for, authorize
from rex.core import (
    get_settings, get_packages,
    Error, Validate, SeqVal, MaybeVal, BoolVal, StrVal, OneOfVal, RecordVal,
    Record
)
from rex.widget import (
    Chrome as BaseChrome,
    Widget, NullWidget, WidgetVal,
    Field, URLVal, computed_field, WidgetComposition
)
from rex.menu import get_menu
from rex.menu.menu import ExternalMenu
from .url import is_external

class Chrome(BaseChrome):
    js_type = 'rex-widget-chrome', 'Chrome'

    @computed_field
    def settings(self):
        settings = get_settings().rex_widget_chrome
        return {
            'manageContent': settings.magic,
            'hideSecondTierMenu': settings.hide_second_tier_menu,
        }

    @computed_field
    def site_root(self, request):
        package_name = get_packages()[0].name
        return url_for(request, '%s:/' % package_name)

    @computed_field
    def menu(self, req):
        menu = get_menu()
        return [self.menu_item(req, item) for item in menu.items]

    def menu_item(self, req, item):
        return self.menu1_item(req, item) if item.items \
                                          else self.menu2_item(req, item)

    def menu1_item(self, req, item1):
        items = [self.menu2_item(req, item) for item in item1.items]
        return {
            'id': item1.title.replace(' ', '-'),
            'title': item1.title,
            'permitted': any([item['permitted'] for item in items]),
            'items': items
        }

    def menu2_item(self, req, item2):
        Item = Record.make('Item', ('title', 'url'))
        if isinstance(item2, str):
            item2 = Item(title=None, url=item2)
        if item2.handler:
            handler = item2.handler
            if is_external(handler.path):
                title = item2.title or 'Untitled'
                url = handler.path
                permitted = True
            elif isinstance(handler, ExternalMenu):
                title = item2.title or 'Untitled'
                url = handler.value
                permitted = True
            else:
                title = item2.title or title_from_handler(handler) or 'Untitled'
                package_name = get_packages()[0].name
                url = url_for(req, '%s:%s' % (package_name, handler.path))
                permitted = authorize(req, handler)
        else:
            raise Error('Handler is required for 2nd level menu items, see')
        return {
            'id': item2.handler.path,
            'title': title,
            'url': url,
            'permitted': permitted,
            'new_window': item2.new_window if hasattr(item2, 'new_window') else False
        }

    @computed_field
    def application_banner(self, req):
        return get_settings().application_banner

    @computed_field
    def application_title(self, req):
        return get_settings().application_title

    @computed_field
    def application_logout_url(self, req):
        return get_settings().application_logout_url

    @computed_field
    def username(self, req):
        query = get_settings().username_query
        with get_db():
            username  = Query(query).produce().data
        return username  or req.remote_user

    @computed_field
    def user_profile_url(self, req):
        url = get_settings().user_profile_url
        if url:
            url = url_for(req, url)
        return url


def title_from_handler(handler):
    if hasattr(handler, 'title'):
        return handler.title
    if hasattr(handler, 'action'):
        return handler.action.title
