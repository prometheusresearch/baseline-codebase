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
        menu = get_settings().menu
        return [self.menu1_item(req, item) for item in menu]

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
        if is_external(item2.url):
            title = item2.title or 'Untitled'
            url = item2.url
            permitted = True
        else:
            handler = route(item2.url)
            title = item2.title or title_from_handler(handler) or 'Untitled'
            url = url_for(req, item2.url)
            permitted = authorize(req, handler)
        return {
            'id': item2.url,
            'title': title,
            'url': url,
            'permitted': permitted,
            'new_window': item2.new_window,
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
