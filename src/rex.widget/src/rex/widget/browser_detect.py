
from werkzeug.useragents import UserAgent
from rex.core import get_settings
from rex.web import render_to_response
from .render import Bootstrap

class WarnIncompatibleBrowser(Bootstrap):

    name = 'warn_incompatible_browser'

    @classmethod
    def enabled(cls):
        return get_settings().rex_widget.warn_incompatible_browser

    def __call__(self, req):
        ua = UserAgent(req.environ)
        if ua.platform == 'ipad' \
        or ua.browser == 'firefox' and ua.version > '38' \
        or ua.browser == 'chrome' and ua.version > '30':
            return ''
        res = render_to_response('rex.widget:/templates/warn_browser.html', req)
        return ''.join(res.body)

