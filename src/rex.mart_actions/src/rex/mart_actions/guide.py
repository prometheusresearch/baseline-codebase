#
# Copyright (c) 2016, Prometheus Research, LLC
#

from collections import OrderedDict
import json
import yaml
import threading

from cachetools import LRUCache
from webob import Response

from htsql.core.domain import EnumDomain
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers
from htsql.core.syn.syntax import Syntax
from rex.action import typing
from rex.core import Extension, Validate, Error, get_rex, get_settings, \
    MaybeVal, RecordVal, UStrVal, BoolVal, UnionVal, OneOfVal, SeqVal, AnyVal, ChoiceVal, IntVal
from rex.db import SyntaxVal, Query
from rex.widget import Field, responder, RequestURL, as_transitionable, \
    RSTVal

from .filter import MartFilteredAction
from .tool import MartTool
from .base import MART_TYPE
from .validate import RefinedVal, OnFieldValue
from .charting import ChartVal

__all__ = (
    'GuideMartTool',
    'GuideMartAction',
    'GuideExporter',
)


@as_transitionable(Syntax, tag='s')
def _format_syntax(value, request, path):
    # pylint: disable=unused-argument
    return unicode(value)


def quote_or_null(value):
    if value is None:
        return u'null()'
    return u"'%s'" % (value.replace("'", "''"),)


class GuideMartTool(MartTool):
    name = 'guide'

    @classmethod
    def is_enabled_for_mart(cls, mart):
        return True


class GuideExporterVal(UStrVal):
    def __call__(self, data):
        value = super(GuideExporterVal, self).__call__(data)
        exporter = GuideExporter.mapped().get(value, None)
        if not exporter:
            raise Error('Unknown GuideExporter "%s"' % (value,))
        return {
            'name': exporter.name,
            'title': exporter.title,
            'mime_type': exporter.mime_type,
        }


FieldInclusionVal = RecordVal(  # pylint: disable=invalid-name
    ('include', UStrVal(r'^([\w]+|\*)(\.([\w]+|\*))*$')),
    ('title', UStrVal, None),
    ('selected', BoolVal, True),
    ('_type', UStrVal, None),
)

FieldExclusionVal = RecordVal(  # pylint: disable=invalid-name
    ('exclude', UStrVal(r'^[\w]+(\.[\w]+)*$')),
)

FieldExpressionVal = RecordVal(  # pylint: disable=invalid-name
    ('expression', SyntaxVal),
    ('title', UStrVal),
    ('selected', BoolVal, True),
)

FieldConfigVal = UnionVal(  # pylint: disable=invalid-name
    ('include', FieldInclusionVal),
    ('exclude', FieldExclusionVal),
    ('expression', FieldExpressionVal),
)

FilterConfigVal = RecordVal(  # pylint: disable=invalid-name
    ('expression', SyntaxVal),
    ('title', UStrVal),
)

FilterParamsVal = RecordVal(  # pylint: disable=invalid-name
    ('id', IntVal(0)),
    ('value', AnyVal),
    (
        'op',
        ChoiceVal(
            '=',
            '!=',
            '<',
            '<=',
            '>',
            '>=',
        ),
        None,
    ),
)

SortParamsVal = RecordVal(  # pylint: disable=invalid-name
    ('id', IntVal(0)),
    ('dir', ChoiceVal('asc', 'desc'), 'asc'),
)


FILTER_GENERATORS = {
    'text': lambda spec, params: '(%s)~%s' % (
        spec['expression'],
        quote_or_null(params['value']),
    ),

    'boolean': lambda spec, params: "(%s)=%s" % (
        spec['expression'],
        {
            True: 'true()',
            False: 'false()',
        }.get(params['value'], 'null()'),
    ),

    'enum': lambda spec, params: '(%s)={%s}' % (
        spec['expression'],
        ','.join([
            quote_or_null(val)
            for val in params['value']
            if val
        ]),
    ),

    'integer': lambda spec, params: '(%s)%s%s' % (
        spec['expression'],
        params['op'],
        params['value'] or 'null()',
    ),

    'float': lambda spec, params: '(%s)%s%s' % (
        spec['expression'],
        params['op'],
        params['value'] or 'null()',
    ),

    'decimal': lambda spec, params: '(%s)%s%s' % (
        spec['expression'],
        params['op'],
        params['value'] or 'null()',
    ),

    'date': lambda spec, params: '(%s)%s%s' % (
        spec['expression'],
        params['op'],
        ('date(%s)' % (quote_or_null(params['value']),))
        if params['value'] else 'null()',
    ),

    'time': lambda spec, params: '(%s)%s%s' % (
        spec['expression'],
        params['op'],
        ('time(%s)' % (quote_or_null(params['value']),))
        if params['value'] else 'null()',
    ),

    'datetime': lambda spec, params: '(%s)%s%s' % (
        spec['expression'],
        params['op'],
        ('datetime(%s)' % (quote_or_null(params['value']),))
        if params['value'] else 'null()',
    ),
}


class GuideConfiguration(object):
    def __init__(
            self,
            database,
            table_name,
            field_config=None,
            filter_config=None,
            mask_config=None,
            charts=None):
        self.database = database
        self.table_name = table_name
        self.mask_config = mask_config or []
        self.charts = charts or []

        self.field_config = field_config
        if not self.field_config:
            self.field_config = [FieldInclusionVal({
                'include': '*',
            })]
        self._field_specs = self._generate_field_specs(database)

        self.filter_config = filter_config
        if not self.filter_config:
            self.filter_config = [
                FilterConfigVal({
                    'expression': field['expression'],
                    'title': field['title'],
                })
                for field in self._field_specs
            ]
        self._filter_specs = self._generate_filter_specs(database)

    def get_field_specs(self):

        with self.database:
            # Select all fields
            selected_fields = [idx for idx, _ in enumerate(self._field_specs)]
            # We generate a query and ask only for meta, that way we can get the
            # types of HTSQL expressions.
            query = self.get_htsql(selected_fields=selected_fields) + '/:describe'
            product = produce(query)
            # The assumption is that query results in a list of records, we need
            # those records.
            fields = product.meta.domain.item_domain.fields

        specs = []
        for idx, spec in enumerate(self._field_specs):
            field = fields[idx]
            specs.append({
                'title': spec['title'],
                'selected': spec['selected'],
                'type': unicode(field.domain.__class__),
            })
        return specs

    def get_filter_specs(self):
        return [
            dict([
                (key, val)
                for key, val in spec.items()
                if key != 'expression'
            ])
            for spec in self._filter_specs
        ]

    def get_chart_htsql(self, index):
        chart = self.charts[index]

        fields = []
        for expr in chart.expressions():
            fields.append('%s := %s' % (expr.key, expr.expression))

        filters = []
        for mask in self.mask_config:
            filters.append(u'.filter(%s)' % (unicode(mask),))

        query = '/%s{%s}%s' % (
            self.table_name,
            ', '.join(fields),
            ''.join(filters),
        )
        print query

        return Query(query, db=self.database)

    def get_htsql(
            self,
            selected_fields=None,
            selected_filters=None,
            sort_config=None,
            limit=None,
            offset=None):
        if not selected_fields:
            selected_fields = [
                idx
                for idx, spec in enumerate(self._field_specs)
                if spec['selected']
            ]
        if not selected_filters:
            selected_filters = []

        fields = []
        for sel in selected_fields:
            if sel < 0 or sel > (len(self._field_specs) - 1):
                continue
            col = self._field_specs[sel]['expression']
            if self._field_specs[sel]['title']:
                col += " :as '%s'" % (
                    self._field_specs[sel]['title'].replace("'", "''"),
                )
            fields.append(col)

        filters = []
        for filt in selected_filters:
            try:
                spec = self._filter_specs[filt['id']]
            except IndexError:
                continue
            generator = FILTER_GENERATORS[spec['type']]
            filters.append(u'.filter(%s)' % (
                generator(spec, filt),
            ))

        for mask in self.mask_config:
            filters.append(u'.filter(%s)' % (unicode(mask),))

        query = '/%s{%s}%s' % (
            self.table_name,
            ', '.join(fields),
            ''.join(filters),
        )

        if sort_config:
            sorts = []
            for cfg in sort_config:
                if cfg['id'] < 0 or cfg['id'] > (len(self._field_specs) - 1):
                    continue
                expr = self._field_specs[cfg['id']]['expression']
                if self._field_specs[cfg['id']]['_type'] == 'identity':
                    expr = 'string(%s.id())' % (expr,)
                sorts.append('%s%s' % (
                    expr,
                    '-' if cfg['dir'] == 'desc' else '',
                ))
            if sorts:
                query = '%s.sort(%s)' % (
                    query,
                    ', '.join(sorts),
                )

        if limit is not None:
            query = '%s.limit(%s%s)' % (
                query,
                limit,
                (', %s' % (offset,)) if offset is not None else '',
            )

        return query

    def _generate_field_specs(self, database):
        # pylint: disable=protected-access
        includes = OrderedDict()
        excludes = {}
        expressions = []

        for cfg in self.field_config:
            if hasattr(cfg, 'include'):
                parts = cfg.include.split('.')
                namespace = '.'.join(parts[:-1])
                name = parts[-1]
                key = namespace or None
                if key not in includes:
                    includes[key] = OrderedDict()
                includes[namespace or None][name] = cfg

            elif hasattr(cfg, 'exclude'):
                parts = cfg.exclude.split('.')
                namespace = '.'.join(parts[:-1])
                name = parts[-1]
                key = namespace or None
                if key not in excludes:
                    excludes[key] = {}
                excludes[namespace or None][name] = cfg

            elif hasattr(cfg, 'expression'):
                expressions.append(cfg)

        for namespace, fields in includes.items():
            name = self.table_name
            if namespace:
                name += '.' + namespace
            product = database.produce('/%s{*}/:describe' % (name,))

            if '*' in fields:
                new_fields = OrderedDict()
                for name, cfg in fields.items():
                    if name in new_fields:
                        continue

                    if name != '*':
                        new_fields[name] = cfg
                        continue

                    for field in product.meta.domain.item_domain.fields:
                        if field.tag in new_fields:
                            if not new_fields[field.tag].title:
                                new_fields[field.tag].title = field.header
                            new_fields[field.tag]._type = unicode(
                                field.domain.__class__,
                            )
                        elif field.tag in fields:
                            if not fields[field.tag].title:
                                fields[field.tag].title = field.header
                            new_fields[field.tag] = fields[field.tag]
                            new_fields[field.tag]._type = unicode(
                                field.domain.__class__,
                            )
                        else:
                            prefix = (namespace + '.') if namespace else ''
                            new_fields[field.tag] = FieldInclusionVal({
                                'include': prefix + field.tag,
                                'title': field.header,
                                'selected': cfg.selected,
                                '_type': unicode(field.domain.__class__),
                            })
                includes[namespace] = new_fields
                fields = new_fields

            else:
                for field in product.meta.domain.item_domain.fields:
                    if field.tag in fields:
                        if not fields[field.tag].title:
                            fields[field.tag].title = field.header
                        fields[field.tag]._type = unicode(
                            field.domain.__class__,
                        )

            all_fields = [
                field.tag
                for field in product.meta.domain.item_domain.fields
            ]
            for tag in fields.keys():
                if tag not in all_fields:
                    fields.pop(tag)

        for namespace, fields in excludes.items():
            if namespace not in includes:
                continue
            for field in fields:
                includes[namespace].pop(field, None)

        specs = []

        for namespace, fields in includes.items():
            for field in fields.values():
                specs.append({
                    'expression': unicode(field.include),
                    'title': unicode(field.title),
                    'selected': field.selected,
                    '_type': field._type,
                })

        for expression in expressions:
            specs.append({
                'expression': unicode(expression.expression),
                'title': expression.title,
                'selected': expression.selected,
                '_type': None,
            })

        if not any([spec['selected'] for spec in specs]):
            specs[0]['selected'] = True

        return specs

    def _generate_filter_specs(self, database):
        htsql = '/%s{%s}/:describe' % (
            self.table_name,
            ', '.join([
                unicode(cfg.expression)
                for cfg in self.filter_config
            ]),
        )
        product = database.produce(htsql)

        specs = []
        for cfg, field in zip(
                self.filter_config,
                product.meta.domain.item_domain.fields):
            spec = {
                'title': cfg.title,
                'expression': unicode(cfg.expression),
            }

            if isinstance(field.domain, EnumDomain):
                spec['type'] = 'enum'
                spec['enumerations'] = field.domain.labels
            else:
                spec['type'] = unicode(field.domain)

            if spec['type'] not in FILTER_GENERATORS:
                continue
            specs.append(spec)

        return specs


class GuideMartAction(MartFilteredAction):

    name = 'mart-guide'
    js_type = 'rex-mart-actions', 'Guide'
    tool = 'guide'

    table = Field(
        UStrVal(),
        doc='The table to base the query from.',
    )

    fields = Field(
        SeqVal(FieldConfigVal),
        default=[],
        doc='The fields the user is allowed to choose from. Defaults to all'
        ' columns on the base table.',
    )

    filters = Field(
        SeqVal(FilterConfigVal),
        default=[],
        doc='The filters the user is allowed to choose from.',
    )

    masks = Field(
        SeqVal(SyntaxVal),
        default=[],
        doc='Filter conditions to always apply to the query.',
    )

    allowed_exporters = Field(
        SeqVal(GuideExporterVal),
        default=[],
        doc='Which exports to allow the user to access. Defaults to all'
        ' available.',
    )

    charts = Field(
        SeqVal(ChartVal),
        default=[],
        doc='Preconfigured charts',
        as_transitionable=lambda self, charts: [{
            'title': c.config.title,
            'type': c.config.type,
            'element': c.render(),
        } for c in charts]
    )

    allow_adhoc_charts = Field(
        BoolVal(),
        default=False,
        doc='Allow configuring ad-hoc charts',
    )

    text = Field(
        RSTVal(),
        default=None,
        doc='The help text to display in the guide.'
    )

    preview_record_limit = Field(
        IntVal(1),
        default=None,
        doc='The maximum number of records to show in the preview pane.'
        ' Defaults to all records.',
    )

    def __init__(self, **values):
        super(GuideMartAction, self).__init__(**values)
        if not self.icon:
            self.icon = 'bookmark'
        if not self.allowed_exporters:
            self.allowed_exporters = SeqVal(GuideExporterVal)(
                sorted(GuideExporter.mapped().keys())
            )

        rex = get_rex()
        if not hasattr(rex, 'mart_guide_cfg'):
            rex.mart_guide_cfg = LRUCache(
                maxsize=get_settings().mart_htsql_cache_depth,
            )
        for key in rex.mart_guide_cfg.keys():
            if key.startswith('%s|' % id(self)):
                del rex.mart_guide_cfg[key]

    # TODO: locks?
    def get_config(self, mart):
        rex = get_rex()
        key = '%s|%s' % (id(self), mart.name)
        if key not in rex.mart_guide_cfg:
            rex.mart_guide_cfg[key] = GuideConfiguration(
                mart.get_htsql(),
                self.table,
                field_config=self.fields,
                filter_config=self.filters,
                mask_config=self.masks,
                charts=self.charts,
            )
        return rex.mart_guide_cfg[key]

    @responder(url_type=RequestURL)
    def guide_configuration(self, request):
        mart = self.get_mart(request)
        cfg = self.get_config(mart)
        return Response(json={
            'fields': cfg.get_field_specs(),
            'filters': cfg.get_filter_specs(),
        })

    @responder(url_type=RequestURL)
    def guide_chart_results(self, request):
        index = IntVal()(request.GET.get('index'))
        mart = self.get_mart(request)
        cfg = self.get_config(mart)
        query = cfg.get_chart_htsql(index)
        return query(request)

    @responder(url_type=RequestURL)
    def guide_results(self, request):
        mart = self.get_mart(request)
        cfg = self.get_config(mart)

        selected_columns = SeqVal(IntVal(0))(
            request.json.get('columns', [])
        )
        selected_filters = SeqVal(FilterParamsVal)(
            request.json.get('filters', [])
        )
        sort = SeqVal(SortParamsVal)(
            request.json.get('sort', [])
        )
        limit = MaybeVal(IntVal(0))(
            request.json.get('limit', None),
        )
        offset = MaybeVal(IntVal(0))(
            request.json.get('offset', None),
        )
        query = cfg.get_htsql(
            selected_fields=selected_columns,
            selected_filters=selected_filters,
            sort_config=sort,
            limit=limit,
            offset=offset,
        )

        with mart.get_htsql():
            product = produce(query)
            fmt = accept(request.environ)
            header_list = emit_headers(fmt, product)
            app_iter = list(emit(fmt, product))
            return Response(headerlist=header_list, app_iter=app_iter)

    def context(self):
        ictx = {'mart': MART_TYPE}
        ictx.update({
            self.get_definition_context(self.definition): typing.anytype,
        })
        octx = {}
        return ictx, octx


class GuideExporter(Extension):
    """
    An extension that allows programmers to add custom HTSQL exporters as
    options in RexGuide.
    """

    #: A unique identifier representing the exporter.
    name = None

    #: A description of the exporter.
    title = None

    #: The MIME type to use with HTSQL to request the appropriate output type.
    mime_type = None

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None \
            and cls.title is not None \
            and cls.mime_type is not None


class CsvGuideExporter(GuideExporter):
    name = 'csv'
    title = 'Comma-Separated Values (CSV)'
    mime_type = 'text/csv'


class TsvGuideExporter(GuideExporter):
    name = 'tsv'
    title = 'Tab-Separated Values (TSV)'
    mime_type = 'text/tab-separated-values'


class XlsGuideExporter(GuideExporter):
    name = 'xls'
    title = 'Microsoft Excel (XLS)'
    mime_type = 'application/vnd.ms-excel'


class XlsxGuideExporter(GuideExporter):
    name = 'xlsx'
    title = 'Microsoft Excel 2007+ (XLSX)'
    mime_type = \
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
