#
# Copyright (c) 2016, Prometheus Research, LLC
#


import re

from htsql.core import domain

from rex.action import typing
from rex.core import Validate, Error
from rex.core import RecordVal, SeqVal, StrVal
from rex.mart import MartAccessPermissions
from rex.web import authenticate
from rex.widget import Field, computed_field, raw_widget

from .base import MartAction
from .filter import MartIntroAction
from .tool import MartTool


__all__ = (
    'GuideIntroAction',
    'GuideFilterAction',
    'GuideChooseColumnsAction',
    'GuideExportAction',
)


class FilterVal(Validate):
    _validate = RecordVal(
        ('title', StrVal(), None),
        ('hint', StrVal(), None),
        ('expression', StrVal()),
    )

    def __call__(self, value):
        if isinstance(value, basestring):
            value = {'title': value, 'expression': value}
        return self._validate(value)


RE_SAFE_TITLE = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')


class ColumnVal(Validate):
    _validate_record = RecordVal(
        ('title', StrVal(), None),
        ('expression', StrVal()),
    )

    def __call__(self, value):
        if isinstance(value, basestring):
            value = {'title': value, 'expression': value}
        value = self._validate_record(value)

        if not RE_SAFE_TITLE.match(value.title):
            value = value.__clone__(title=self.clean_title(value.title))

        return value

    def clean_title(self, title):  # pylint: disable=no-self-use
        title = re.sub(r'^[^a-zA-Z_]+', '', title)
        title = re.sub(r'[^a-zA-Z0-9_]', '_', title)
        return title


def reflect_table_fields(database, table, validate=ColumnVal()):
    product = database.produce('/%s/:describe' % table)
    fields = product.meta.domain.item_domain.fields
    return [validate(f.tag) for f in fields]


def reflect_table_filters(database, table, validate=FilterVal()):
    product = database.produce('/%s/:describe' % table)
    fields = product.meta.domain.item_domain.fields
    return [validate(f.tag)
            for f in fields
            if any([isinstance(f.domain, domain_type)
                    for domain_type in FILTERS])]


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
        mart = self.get_mart_for_reflection(req)
        if not mart:
            return None
        database = self.get_mart_db(mart)
        return reflect_table_fields(database, self.table)

    def get_mart_for_reflection(self, req):
        user = authenticate(req)
        permissions = MartAccessPermissions.top()
        marts = permissions.get_marts_for_user(
            user,
            definition_id=self.definition,
        )
        return marts[0] if marts else None

    def context(self):
        ictx = {'mart': typing.number}
        ictx.update({
            self.get_definition_context(self.definition): typing.anytype,
        })
        octx = {}
        return ictx, octx


FILTERS = {
    domain.BooleanDomain: {
        'widget': ('rex-mart-actions', 'BooleanFilter'),
    },
    domain.TextDomain: {
        'widget': ('rex-mart-actions', 'TextFilter'),
    },
    domain.EnumDomain: {
        'widget': ('rex-mart-actions', 'EnumFilter'),
        'props': lambda d: {'labels': d.labels},
    },
    domain.IntegerDomain: {
        'widget': ('rex-mart-actions', 'NumericFilter'),
    },
    domain.FloatDomain: {
        'widget': ('rex-mart-actions', 'NumericFilter'),
    },
    domain.DecimalDomain: {
        'widget': ('rex-mart-actions', 'NumericFilter'),
    },
    domain.DateDomain: {
        'widget': ('rex-mart-actions', 'DateFilter'),
    },
    domain.DateTimeDomain: {
        'widget': ('rex-mart-actions', 'DateFilter'),
    },
}


class GuideFilterAction(GuideAction):
    """
    Allows a user to choose from a list of configured filters to apply to their
    query.
    """

    name = 'mart-guide-filter'
    js_type = 'rex-mart-actions', 'FilterDataset'

    filters = Field(
        SeqVal(FilterVal()), default=None,
        transitionable=False,
        doc="""
        Filter definitions.
        """)

    @computed_field
    def filter_elements(self, req):
        mart = self.get_mart_for_reflection(req)
        if not mart:
            return None

        database = self.get_mart_db(mart)

        filters = (
                self.filters or
                reflect_table_filters(database, self.table))

        query = '/%s{%s}/:describe' % (
            self.table,
            ', '.join(f.expression for f in filters),
        )
        meta = database.produce(query).meta.domain.item_domain

        compiled = []
        for field, filt in zip(meta.fields, filters):
            cfg = FILTERS.get(field.domain.__class__)
            if not cfg:
                raise Error(
                    'filter expression type is not currently supported:',
                    filt.expression,
                )

            props = {
                'title': filt.title,
                'expression': filt.expression,
            }
            if cfg.get('props'):
                props.update(cfg['props'](field.domain))

            widget = raw_widget(
                cfg['widget'],
                **props
            )
            compiled.append(widget)

        return compiled


class GuideChooseColumnsAction(GuideAction):
    """
    Allows a user to select the columns to return in their query.
    """

    name = 'mart-guide-columns'
    js_type = 'rex-mart-actions', 'ChooseColumns'

    fields = Field(
        SeqVal(ColumnVal()), default=[],
        transitionable=False,
        doc="""
        Column definitions.
        """)

    @computed_field
    def all_fields(self, req):
        mart = self.get_mart_for_reflection(req)
        if not mart:
            return None
        database = self.get_mart_db(mart)
        return reflect_table_fields(database, self.table) + self.fields


class GuideExportAction(GuideAction):
    """
    Allows a user to download the results of their query as a file.
    """

    name = 'mart-guide-export'
    js_type = 'rex-mart-actions', 'ExportDataset'

    fields = Field(
        SeqVal(ColumnVal()), default=[],
        doc="""
        Column definitions.
        """)

