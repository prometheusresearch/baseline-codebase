"""

    rex.widget.rexdb
    ================

    :copyright: 2014, Prometheus Research, LLC

"""

from __future__ import absolute_import

from rex.core import (
    StrVal, BoolVal, SeqVal, RecordVal, RecordField, ChoiceVal,
    cached, get_settings)
from rex.web import authorize, url_for
from .parse import WidgetVal
from .widget import Widget, ContextValue, StateRead, NullWidget
from .state import State
from .field import Field, StateField, CollectionField
from .library import Page as BasePage


class Page(BasePage):
    """ Page."""

    name = 'RexPage'
    js_type = 'rex-widget/lib/rex/Page'

    APPLETS = 'APPLETS'

    application_name = Field(
        StrVal(), default=ContextValue('application_name'),
        doc='Application name')

    navigation = Field(
        BoolVal(), default=True,
        doc='If navigation bar should be rendered')

    title = Field(
        StrVal(),
        doc='Page title')

    @property
    def metadata(self):
        return {'title': self.title}

    @cached
    def descriptor(self):
        descriptor = super(Page, self).descriptor()
        state = descriptor.state
        ui = descriptor.ui

        # enrich SITEMAP state with menu configuration
        # TODO: should this be in another state? probably but I like how we can
        # access it now via RexWidget.Sitemap API
        sitemap_state = descriptor.state[self.SITEMAP]
        sitemap = dict(sitemap_state.value)
        menu = self.context.get('menu') or sitemap['pages'].keys()
        sitemap['menu'] = menu
        state = state.add(sitemap_state._replace(value=sitemap))

        # add APPLETS state
        state = state.add(State(
            self.APPLETS,
            widget=self,
            is_writable=False,
            persistence=State.INVISIBLE,
            computator=self.applets))
        props = dict(ui.props)
        props['applets'] = StateRead(self.APPLETS)
        ui = ui._replace(props=props)

        return descriptor._replace(state=state, ui=ui)

    def applets(self, widget, state, graph, request=None, **kwargs):
        assert request is not None
        applets = []
        active = None

        for app in get_settings().registered_apps:
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


class NavigationList(Widget):
    """ NavigationList"""

    name = 'RexNavigationList'
    js_type = 'rex-widget/lib/rex/NavigationList'

    item_type = RecordVal(
        RecordField('label', StrVal()),
        RecordField('to', StrVal()),
        RecordField('description', StrVal(), None),
        RecordField('icon', StrVal(), None),
        )

    items = Field(
        SeqVal(item_type), default=[],
        doc="Navigation items")


class Table(Widget):

    name = 'RexTable'
    js_type = 'rex-widget/lib/rex/Table'

    data = CollectionField(
        doc='Data for table')

    columns = Field(
        SeqVal(), default=None,
        doc='Column specification')

    selectable = Field(
        BoolVal(), default=False,
        doc='If table should make rows selectable')

    selected = StateField(
        StrVal(), default=None,
        doc='Initial selected row id')


class Button(Widget):

    name = 'RexButton'
    js_type = 'rex-widget/lib/rex/Button'

    label = Field(
        StrVal(), default=None,
        doc='Button label')

    icon = Field(
        StrVal(), default=None,
        doc='Button icon')

    size = Field(
        ChoiceVal(None, 'xs', 'sm', 'lg'), default=None,
        doc='Size')

    href = Field(
        StrVal(), default=None,
        doc='If specified button will work as a link')

    primary = Field(
        BoolVal(), default=False,
        doc='Render button as "primary" button')
    

class ButtonGroup(Widget):

    name = 'RexButtonGroup'
    js_type = 'rex-widget/lib/rex/ButtonGroup'

    buttons = Field(
        WidgetVal(widget_class=Button),
        doc='Buttons')

    size = Field(
        ChoiceVal(None, 'xs', 'sm', 'lg'), default=None,
        doc='Size')


class Panel(Widget):

    name = 'RexPanel'
    js_type = 'rex-widget/lib/rex/Panel'

    title = Field(
        StrVal(),
        doc='Panel title')

    children = Field(
        WidgetVal(), default=NullWidget(),
        doc='Panel contents')

    toolbar = Field(
        WidgetVal(), default=NullWidget(),
        doc='Panel toolbar')
