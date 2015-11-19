
from rex.core import RecordVal, AnyVal, StrVal, MapVal, SeqVal, MaybeVal, \
                     BoolVal, ChoiceVal
from rex.core import get_packages, cached, get_settings
from rex.web import get_routes, authorize, url_for

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
        try:
            from rex.db_user import get_username
            return get_username(request) or request.remote_user
        except ImportError:
            return request.remote_user

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
