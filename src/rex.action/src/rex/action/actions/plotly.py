"""

    rex.action_chart
    ================

    :copyright: 2015, Prometheus Research, LLC

"""

from rex.action import Action, Field
from rex.action.typing import RecordTypeVal, RecordType
from rex.action.validate import SyntaxVal
from rex.core import AnyVal
from rex.db import Query
from rex.port import Port
from rex.widget import responder, QueryURL

__all__ = ('Plotly',)


class Plotly(Action):
    """ Plotly action."""

    name = 'plotly'
    js_type = 'rex-action/lib/actions/Plotly'

    input = Field(
        RecordTypeVal(), default=RecordType.empty())

    query = Field(
        SyntaxVal(), transitionable=False,
        doc="""
        Query data for plot.
        """)

    plot = Field(
        AnyVal(), default={},
        doc="""
        Plot.ly layout config.
        """)

    layout = Field(
        AnyVal(), default={},
        doc="""
        Plot.ly layout config.
        """)

    @responder(url_type=QueryURL)
    def data(self, req):
        query = Query(self.query)
        return query(req)

    def context(self):
        input = self.input if self.input.rows else self.domain.record()
        output = self.domain.record()
        return input, output
