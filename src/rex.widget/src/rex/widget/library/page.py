"""

    rex.widget.library.page
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal, MapVal
from rex.core import get_packages, cached
from rex.web import get_routes

from ..widget import Widget, NullWidget, StateRead
from ..field import Field
from ..parse import WidgetVal
from ..state import State
from ..urlmap import WidgetRenderer

__all__ = ('Page',)


class Page(Widget):
    """ Widget which represents entire page."""

    name = 'Page'
    js_type = 'rex-widget/lib/Page'

    SITEMAP = 'SITEMAP'

    id = Field(
        StrVal(),
        doc='Page identifier')

    children = Field(
        WidgetVal(), default=NullWidget(),
        doc='Page contents')

    params = Field(
        MapVal(StrVal(), StrVal()), default={},
        doc='Mapping from query string parameters to state identifiers')

    class_name = Field(
        StrVal(), default=None,
        doc='CSS class name')

    @property
    def metadata(self):
        return {}

    @cached
    def descriptor(self):
        descriptor = super(Page, self).descriptor()

        state = descriptor.state.add(State(
            self.SITEMAP,
            widget=self,
            is_writable=False,
            persistence=State.INVISIBLE,
            value=self.sitemap()))

        props = dict(descriptor.ui.props)
        props['sitemap'] = StateRead(self.SITEMAP)
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
                    params = None
                elif not isinstance(handler.widget, Page):
                    params = None
                else:
                    page = handler.widget
                    metadata = {'location': location}
                    metadata.update(page.metadata)
                    pages[page.id] = metadata
                    params = {k: True for k in page.params}
                locations[location] = params
        return {'locations': locations, 'pages': pages}


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



