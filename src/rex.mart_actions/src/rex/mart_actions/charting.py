#
# Copyright (c) 2017, Prometheus Research, LLC
#

import yaml

from cachetools import LRUCache
from webob import Response

from htsql.core.domain import EnumDomain
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers
from htsql.core.syn.syntax import Syntax
from rex.action import typing
from rex.core import cached, Extension, Validate, Error, get_rex, get_settings, \
    MaybeVal, RecordVal, UStrVal, BoolVal, UnionVal, OneOfVal, SeqVal, AnyVal, ChoiceVal, IntVal
from rex.db import SyntaxVal
from rex.widget import raw_widget, undefined

from .validate import RefinedVal, ExpressionVal, OnFieldValue


__all__ = ('ChartVal',)

class Chart(Extension):
    """ Chart."""

    #
    # Declatation API
    #

    # Chart name is used to differentiate between charts when validating
    # configuration.
    name = None

    # Specify validator for reading chart config, the result of a validator is
    # then passed to a constructor.
    validate = NotImplemented

    # js_type is used to specify the JavaScript code which will render the chart
    # UI
    js_type = None

    def expressions(self):
        """ List of expressions used in a chart.

        Charts should implement this methods to return all expressions which
        are being defined by the chart.
        """
        raise NotImplementedError('%r.expressions() is not implemented' % self.__class__)

    #
    # Implementation
    #

    @classmethod
    def signature(cls):
        return cls.name

    @classmethod
    def enabled(cls):
        return cls.name is not None

    @classmethod
    def sanitize(cls):
        # consider chart as being "abstract" if name is none
        if cls.name is None:
            return
        assert cls.js_type is not None, '%r.js_type is not defined' % cls
        assert cls.expressions is not Chart.expressions, '%r.expressions() is not defined' % cls
        assert cls.validate is not None, '%r.validate is not defined' % cls

    def __init__(self, config):
        self.config = config

    def render(self):
        return raw_widget(self.js_type, {'config': self.config})

    def __repr__(self):
        return '<%r %r>' % (self.__class__, self.config)


class PieChart(Chart):
    """ Pie chart."""

    name = 'pie'

    js_type = ('rex-mart-actions', 'PieChart')

    validate = RecordVal(
        ('label', ExpressionVal),
        ('value', ExpressionVal),
    )

    def expressions(self):
        return [self.config.label, self.config.value]


class LineChart(Chart):
    """ Line chart."""

    name = 'line'

    js_type = ('rex-mart-actions', 'LineChart')

    validate_line = RecordVal(
        ('value', ExpressionVal),
        ('color', UStrVal, undefined),
    )

    validate = RecordVal(
        ('label', ExpressionVal),
        ('lines', SeqVal(validate_line)),
    )

    def expressions(self):
        return [self.config.label] + [line.value for line in self.config.lines]


class AreaChart(Chart):
    """ Area chart."""

    name = 'area'

    js_type = ('rex-mart-actions', 'AreaChart')

    validate_area = RecordVal(
        ('value', ExpressionVal),
        ('color', UStrVal, undefined),
    )

    validate = RecordVal(
        ('label', ExpressionVal),
        ('areas', SeqVal(validate_area)),
    )

    def expressions(self):
        return [self.config.label] + [area.value for area in self.config.areas]


class BarChart(Chart):
    """ Bar chart."""

    name = 'bar'

    js_type = ('rex-mart-actions', 'BarChart')

    validate_bar = RecordVal(
        ('value', ExpressionVal),
        ('color', UStrVal, undefined),
    )

    validate = RecordVal(
        ('label', ExpressionVal),
        ('stacked', ChoiceVal('horizontal', 'vertical'), 'horizontal'),
        ('bars', SeqVal(validate_bar)),
    )

    def expressions(self):
        return [self.config.label] + [bar.value for bar in self.config.bars]


class ScatterChart(Chart):
    """ Scatter chart."""

    name = 'scatter'

    js_type = ('rex-mart-actions', 'ScatterChart')

    validate = RecordVal(
        ('x', ExpressionVal),
        ('y', ExpressionVal),
    )

    def expressions(self):
        return [self.config.x, self.config.y]


class ChartVal(RefinedVal):
    """ Validate charts."""

    @property
    @cached
    def validator(self):
        variants = []
        for chart_type in Chart.all():
            validate = chart_type.validate
            # check if need to inject 'type' and 'title' validator
            if isinstance(validate, RecordVal):
                if 'type' not in validate.fields:
                    fields = validate.fields.values() + [('type', UStrVal)]
                    validate = RecordVal(*fields)
                if 'title' not in validate.fields:
                    fields = validate.fields.values() + [('title', UStrVal, None)]
                    validate = RecordVal(*fields)
            variants.append((OnFieldValue('type', chart_type.name), validate))
        return UnionVal(*variants)

    def refine(self, value):
        chart_types = Chart.mapped()
        chart_type = chart_types.get(value.type)
        if chart_type is None:
            raise Error('Unknown chart type:', value.type)
        return chart_type(value)
