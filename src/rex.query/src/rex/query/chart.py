#
# Copyright (c) 2017, Prometheus Research, LLC
#

from .extension import Chart

__all__ = ('PieChart', 'LineChart', 'BarChart', 'AreaChart', 'ScatterChart')

class PieChart(Chart):
    type = 'pie'
    js_type = 'rex-query', 'pieChart'

class LineChart(Chart):
    type = 'line'
    js_type = 'rex-query', 'lineChart'

class AreaChart(Chart):
    type = 'area'
    js_type = 'rex-query', 'areaChart'

class BarChart(Chart):
    type = 'bar'
    js_type = 'rex-query', 'barChart'

class ScatterChart(Chart):
    type = 'scatter'
    js_type = 'rex-query', 'scatterChart'
