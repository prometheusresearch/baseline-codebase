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
from ..validate import EntityDeclarationVal, RexDBVal

__all__ = ('Drop',)


class Drop(Action):
    """ Drop an entity.
    """

    name = 'drop'
    js_type = 'rex-action/lib/Actions/Drop'

    entity = Field(
        EntityDeclarationVal(),
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
        return Port(self.entity.type, db=self.db)

    def context(self):
        input = {self.entity.name: self.entity.type}
        output = {}
        return input, output
