"""

    rex.action.actions.pick_date
    ============================

    :copyright: 2015, Prometheus Research, LLC

"""

from cached_property import cached_property

from rex.core import StrVal
from rex.db import Query
from rex.widget import Field, QueryURL, responder, computed_field, undefined
from rex.widget import dataspec

from ..action import Action
from ..validate import QueryVal
from ..typing import ValueType


__all__ = ('PickDate',)


class PickDate(Action):

    name = 'pick-date'
    js_type = 'rex-action/lib/actions/PickDate'

    annotate_month = Field(
        QueryVal(), default=None, transitionable=False,
        doc="""
        Annotate day with data
        """)

    annotate_year = Field(
        QueryVal(), default=None, transitionable=False,
        doc="""
        Annotate month with data
        """)

    def wrap_annotate_month_query(self, url):
        return dataspec.CollectionSpec(url, {}) if self.annotate_month is not None else undefined

    def wrap_annotate_year_query(self, url):
        return dataspec.CollectionSpec(url, {}) if self.annotate_year is not None else undefined

    @responder(wrap=wrap_annotate_month_query, url_type=QueryURL)
    def annotate_month_query(self, req):
        return self.annotate_month(req)

    @responder(wrap=wrap_annotate_year_query, url_type=QueryURL)
    def annotate_year_query(self, req):
        return self.annotate_year(req)

    def context(self):
        return self.domain.record(), self.domain.record(date='date')
