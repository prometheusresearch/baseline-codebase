
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
        if allowed(ua):
            return ''
        res = render_to_response('rex.widget:/templates/warn_browser.html', req)
        return res.body


def allowed(ua):
    # Workaround for werkzeug which can't parase Edge UA at the moment.
    if 'Edge/' in ua.string:
        return False
    return (
        ua.platform == 'ipad' or
        ua.browser == 'safari' and ua.version > '10' or
        ua.browser == 'firefox' and ua.version > '38' or
        ua.browser == 'chrome' and ua.version > '30'
    )

