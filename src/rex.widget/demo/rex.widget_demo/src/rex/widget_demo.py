"""

    rex.widget_demo
    ===============

    :copyright: 2014, Prometheus Research, LLC

"""

from rex.core import StrVal, AnyVal, cached
from rex.widget import (
    Widget, Page, Field, EntityField, WidgetVal, NullWidget,
    ContextValue)

class StudyInfo(Widget):
    """ Show information about the study"""

    name = 'StudyInfo'
    js_type = 'rex-widget-demo/lib/StudyInfo'

    id      = Field(StrVal)
    data    = EntityField()


class Navigation(Widget):

    name = 'Navigation'
    js_type = 'rex-widget-demo/lib/Navigation'

    application_name = Field(
        StrVal(), default=ContextValue('application_name'),
        doc='Application name')

    sitemap = Field(
        AnyVal, default={},
        doc='Sitemap')


class RexPage(Page):

    name = 'RexPage'
    js_type = 'rex-widget-demo/lib/RexPage'

    navigation = Field(
        WidgetVal(), default=NullWidget(),
        doc='Navigation widget')

    application_name = Field(
        StrVal(), default=ContextValue('application_name'),
        doc='Application name')

    title = Field(
        StrVal(),
        doc='Page title')

    @property
    def metadata(self):
        return {'title': self.title}

    @cached
    def descriptor(self):
        descriptor = super(RexPage, self).descriptor()
        sitemap_state = descriptor.state[self.SITEMAP]
        sitemap = dict(sitemap_state.value)
        menu = self.context.get('menu') or sitemap['pages'].keys()
        sitemap['menu'] = menu
        return descriptor._replace(
            state=descriptor.state.add(sitemap_state._replace(value=sitemap)))
