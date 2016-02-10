"""

    rex.action.actions.drop
    =======================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import StrVal, IntVal
from rex.port import Port
from rex.widget import Field, RSTVal, PortURL, responder, undefined

from ..action import Action
from ..validate import RexDBVal
from ..typing import RowTypeVal, annotate_port

__all__ = ('Drop',)


class Drop(Action):
    """ Drop an entity.
    """

    name = 'drop'
    js_type = 'rex-action/lib/actions/Drop'

    class Introspection(Action.Introspection):
        info_js_type = 'rex-action/lib/inspect/DropActionInfo'
        detailed_info_js_type = 'rex-action/lib/inspect/DropDetailedActionInfo'

    entity = Field(
        RowTypeVal(),
        doc="""
        Name of a table in database.
        """)

    db = Field(
        RexDBVal(), default=None,
        transitionable=False,
        doc="""
        Database to use.
        """)

    message = Field(
        RSTVal(), default="You are about to drop an entity",
        doc="""
        Message which is shown before dropping an entity.
        """)

    confirm_delay = Field(
        IntVal(), default=undefined,
        doc="""
        Number of seconds to wait before enabling to drop an entity.
        """)

    @responder(url_type=PortURL)
    def data(self, req):
        return self.port(req)

    @cached_property
    def port(self):
        port = Port(self.entity.type.name, db=self.db)
        return annotate_port(self.domain, port)

    def context(self):
        return self.domain.record(self.entity), self.domain.record()
