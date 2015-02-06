"""

    rex.widget.library.page
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import AnyVal, StrVal, MapVal, SeqVal
from rex.core import get_packages, cached, get_settings
from rex.web import get_routes, authorize, url_for

from ..descriptors import StateRead
from ..widget import Widget, NullWidget
from ..field import Field, undefined
from ..validate import WidgetVal
from ..state import State
from ..urlmap import WidgetRenderer
from ..template import WidgetTemplate
from .layout import Box

__all__ = ('Page',)


class Page(Box):
    """ Widget which represents entire page."""

    name = 'Page'
    js_type = 'rex-widget/lib/Page'

    SITEMAP = 'SITEMAP'
    APPLETS = 'APPLETS'

    id = Field(
        StrVal(),
        doc='Page identifier')

    title = Field(
        StrVal(),
        doc='Page title')

    params = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc='Mapping from query string parameters to state identifiers')


    @cached
    def descriptor(self):
        descriptor = super(Page, self).descriptor()

        # add SITEMAP state
        state = descriptor.state.add(State(
            self.SITEMAP,
            widget=self,
            is_writable=False,
            persistence=State.INVISIBLE,
            value=self.sitemap()))


        # add APPLETS state
        state = state.add(State(
            self.APPLETS,
            widget=self,
            is_writable=False,
            persistence=State.INVISIBLE,
            computator=self.applets))

        props = dict(descriptor.ui.props)
        props['sitemap'] = StateRead(self.SITEMAP)
        props['applets'] = StateRead(self.APPLETS)
        ui = descriptor.ui._replace(props=props)

        if self.params:
            state = state.merge({
                stateid: state[stateid]._replace(alias=alias)
                for alias, stateid in self.params.items()
            })

        return descriptor._replace(state=state, ui=ui)

    @cached
    def sitemap(self):
        """ Iterate over URL mapping and collect sitemap."""
        locations = {}
        pages = {}
        packages = get_packages()
        for package in packages:
            routes = get_routes(package)
            for location, handler in iter_pathmap_tree(routes.tree):
                if not isinstance(handler, WidgetRenderer):
                    locations[location] = None
                    continue
                widget = handler.widget
                if isinstance(widget, WidgetTemplate):
                    widget = widget.underlying()
                if not isinstance(widget, Page):
                    locations[location] = None
                    continue
                metadata = {'location': location, 'title': widget.title}
                pages[widget.id] = metadata
                params = {k: True for k in widget.params}
                locations[location] = params
        return {'locations': locations, 'pages': pages}

    def applets(self, widget, state, graph, request=None, **kwargs):
        assert request is not None
        applets = []
        active = None
        settings = get_settings()

        if hasattr(settings, 'registered_apps'):

            for app in settings.registered_apps:
                info = {
                    'name': app['name'],
                    'title': app['title'],
                    'href': url_for(request, app['home_route']),
                }
                if app.get('show') and authorize(request, app['package']):
                    applets.append(info)
                if app['package'] == request.environ.get('rex.package'):
                    active = info

        return {
            'active': active,
            'applets': applets,
        }


class Navigation(Widget):

    name = 'Navigation'
    js_type = 'rex-widget/lib/Navigation'

    application_name = Field(
        StrVal(), default='Rex Widget Application',
        doc="Application name")

    menu = Field(
        SeqVal(StrVal()), default=undefined,
        doc="Menu")

    applets = Field(AnyVal(), default=StateRead(Page.APPLETS))
    sitemap = Field(AnyVal(), default=StateRead(Page.SITEMAP))


def iter_pathmap_tree(tree, _prefix=''):
    """ Iterate over :mod:`rex.web` routing tree and yield (path, handler)
    pairs.

    TODO: this function belongs to rex.web package
    """
    if not _prefix or _prefix[-1] != '/':
        _prefix += '/'
    for k, v in tree.items():
        if k is None:
            k = ''
        prefix = '%s%s' % (_prefix, k)
        if not isinstance(k, basestring):
            continue
        if isinstance(v, dict):
            for seg in iter_pathmap_tree(v, _prefix=prefix):
                yield seg
        else:
            for _, handler in v:
                if len(prefix) > 1 and prefix[-1] == '/':
                    prefix = prefix[:-1]
                yield prefix, handler



