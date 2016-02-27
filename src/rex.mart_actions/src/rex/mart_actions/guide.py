#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob import Response

from htsql.core import domain

from rex.action import typing
from rex.core import get_settings, Validate, Error
from rex.core import RecordVal, SeqVal, StrVal, OneOfVal
from rex.mart import MartAccessPermissions
from rex.web import authenticate
from rex.widget import responder, RequestURL, Field, computed_field, raw_widget
from rex.db import Query

from .base import MartAction
from .filter import MartIntroAction
from .tool import MartTool


def reflect_table_fields(db, table):
    product = db.produce('/%s/:describe' % table)
    fields = product.meta.domain.item_domain.fields
    validate_column = ColumnVal()
    return [validate_column(f.tag) for f in fields]


class FilterVal(Validate):

    _validate = RecordVal(
        ('title', StrVal(), None),
        ('hint', StrVal(), None),
        ('expression', StrVal()),
    )

    def __call__(self, value):
        return self._validate(value)


class ColumnVal(Validate):

    _validate_record = RecordVal(
        ('title', StrVal(), None),
        ('expression', StrVal()),
    )

    _validate = OneOfVal(StrVal(), _validate_record)

    def __call__(self, value):
        if isinstance(value, self._validate_record.record_type):
            return value
        if isinstance(value, basestring):
            value = {'title': value, 'expression': value}
        return self._validate(value)



class GuideMartTool(MartTool):
    name = 'guide'

    @classmethod
    def is_enabled_for_mart(cls, mart):
        return True


class GuideIntroAction(MartIntroAction):
    name = 'mart-guide'
    tool = 'guide'

    def __init__(self, **values):
        super(GuideIntroAction, self).__init__(**values)
        if not self.icon:
            self.icon = 'bookmark'


class GuideAction(MartAction):

    definition = Field(
        StrVal(),
        doc="""
        Mart Definiton to use.
        """)

    table = Field(
        StrVal(),
        doc="""
        Mart table to query.
        """)

    @computed_field
    def table_fields(self, req):
        mart  = self.get_mart_for_reflection(req)
        if not mart:
            return None
        db = self.get_mart_db(mart)
        return reflect_table_fields(db, self.table)

    def get_mart_for_reflection(self, req):
        user = authenticate(req)
        permissions = MartAccessPermissions.top()
        marts = permissions.get_marts_for_user(user, definition_id=self.definition)
        return marts[0] if marts else None

    def context(self):
        input = {'mart': typing.number}
        input.update({self.get_definition_context(self.definition): typing.anytype})
        output = {}
        return input, output


class FilterDataset(GuideAction):
    """ Filter dataset."""

    name = 'mart-guide-filter'
    js_type = 'rex-mart-actions/lib/guide/FilterDataset'

    filters = Field(
        SeqVal(FilterVal()),
        transitionable=False,
        doc="""
        Filter definitions.
        """)

    @computed_field
    def filter_elements(self, req):
        mart  = self.get_mart_for_reflection(req)
        if not mart:
            return None
        db = self.get_mart_db(mart)
        compiled = []
        query = '/%s{%s}/:describe' % (
            self.table,
            ', '.join(f.expression for f in self.filters))
        meta = db.produce(query).meta.domain.item_domain
        for field, filter in zip(meta.fields, self.filters):
            dom = field.domain
            if isinstance(dom, domain.BooleanDomain):
                filter_widget = raw_widget(
                    'rex-mart-actions/lib/guide/filter/BooleanFilter',
                    title=filter.title,
                    expression=filter.expression)
            elif isinstance(dom, domain.EnumDomain):
                filter_widget = raw_widget(
                    'rex-mart-actions/lib/guide/filter/EnumFilter',
                    title=filter.title,
                    expression=filter.expression,
                    labels=dom.labels)
            elif isinstance(dom, domain.TextDomain):
                filter_widget = raw_widget(
                    'rex-mart-actions/lib/guide/filter/TextFilter',
                    title=filter.title,
                    expression=filter.expression)
            else:
                raise Error(
                    'filter expression type is not currently supported:',
                    filter.expression)
            compiled.append(filter_widget)
        return compiled


class ProjectDataset(GuideAction):
    """ Project dataset."""

    name = 'mart-guide-project'
    js_type = 'rex-mart-actions/lib/guide/ProjectDataset'

    fields = Field(
        SeqVal(ColumnVal()), default=[],
        transitionable=False,
        doc="""
        Column definitions.
        """)

    @computed_field
    def all_fields(self, req):
        mart  = self.get_mart_for_reflection(req)
        if not mart:
            return None
        db = self.get_mart_db(mart)
        return reflect_table_fields(db, self.table) + self.fields


class ExportDataset(GuideAction):
    """ Project dataset."""

    name = 'mart-guide-export'
    js_type = 'rex-mart-actions/lib/guide/ExportDataset'

    fields = Field(
        SeqVal(ColumnVal()), default=[],
        doc="""
        Column definitions.
        """)

