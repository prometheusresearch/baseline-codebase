"""

    rex.widget.test
    ===============

    Rex Widget screen testing framework.

    :copyright: 2014, Prometheus Research, LLC

"""

from urllib import urlencode

from webob import Request

from rex.core import Rex

from .validate import validate
from .parse import parse
from .urlmap import WidgetRenderer
from .json_encoder import dumps

__all__ = ('Screen', 'UI', 'ScreenTest')


class Screen(object):
    """ Represents screen."""

    def __init__(self, widget):
        self.widget = widget
        self.renderer = WidgetRenderer(widget, 'anybody')

    def get(self, params=None):
        params = params or {}
        request = Request.blank('/', query_string=urlencode(params))
        payload = self.renderer.payload(request)
        return UI(self, payload)

    def update(self, values, updates):
        versions = {k: 1 for k in values}
        payload = {
            'values': values,
            'updates': updates,
            'versions': versions,
        }
        request = Request.blank('/', POST=dumps(payload))
        payload = self.renderer.payload(request)
        return UI(self, payload)

    @classmethod
    def define(cls, screen_config):
        widget = validate(parse(screen_config))
        return cls(widget)


class UI(object):
    """ Represents UI state."""

    def __init__(self, screen, payload):
        self.screen = screen
        self.payload = payload

    @property
    def descriptor(self):
        return self.payload['descriptor']

    @property
    def state(self):
        return self.payload['state']

    @property
    def data(self):
        return self.payload['data']

    def update(self, updates):
        values = {k: v for k, v in self.state.items() if k not in updates}
        return self.screen.update(values, updates)


class ScreenTest(object):
    """ Screen test case."""

    screen_config = NotImplemented

    requirements = [
        'rex.widget',
        'rex.widget_demo',
    ]

    settings = {
        'db': 'pgsql:widget_demo',
    }

    def setup_method(self, method):
        self.rex = Rex(*self.requirements, **self.settings)
        self.rex.on()
        self.screen = Screen.define(self.screen_config)

    def teardown_method(self, method):
        self.rex.reset()
        self.rex.off()
