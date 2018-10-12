rex.mart_actions.charting
=========================

Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_actions_demo')
    >>> rex.on()
    >>> from pprint import pprint
    >>> from functools import partial
    >>> pprint = partial(pprint, width=130)

Charts can be queries using rex.core's Extension mechanism::

    >>> from rex.mart_actions.charting import Chart, ChartVal

    >>> Chart.all() # doctest: +NORMALIZE_WHITESPACE
    [rex.mart_actions.charting.PieChart, rex.mart_actions.charting.LineChart,
     rex.mart_actions.charting.AreaChart, rex.mart_actions.charting.BarChart,
     rex.mart_actions.charting.ScatterChart]

Pie chart
---------

::

    >>> pie_chart = ChartVal().parse("""
    ... type: pie
    ... label:
    ...   title: Label
    ...   expression: label_expression
    ... value: value_expression
    ... """)

    >>> pie_chart.config.label
    Expression(title='Label', expression='label_expression')

    >>> pie_chart.config.value
    Expression(title=None, expression='value_expression')

    >>> pie_chart.expressions()
    [Expression(title='Label', expression='label_expression'), Expression(title=None, expression='value_expression')]

Line chart
----------

::

    >>> line_chart = ChartVal().parse("""
    ... type: line
    ... label:
    ...   title: Label
    ...   expression: label_expression
    ... lines:
    ... - value: line_expression
    ... """)

    >>> line_chart.config.label
    Expression(title='Label', expression='label_expression')

    >>> line_chart.config.lines
    [Record(value=Expression(title=None, expression='line_expression'), color=undefined)]

    >>> line_chart.expressions()
    [Expression(title='Label', expression='label_expression'), Expression(title=None, expression='line_expression')]

Area chart
----------

::

    >>> area_chart = ChartVal().parse("""
    ... type: area
    ... label:
    ...   title: Label
    ...   expression: label_expression
    ... areas:
    ... - value: area_expression
    ... """)

    >>> area_chart.config.label
    Expression(title='Label', expression='label_expression')

    >>> area_chart.config.areas
    [Record(value=Expression(title=None, expression='area_expression'), color=undefined)]

    >>> area_chart.expressions()
    [Expression(title='Label', expression='label_expression'), Expression(title=None, expression='area_expression')]

Bar chart
---------

::

    >>> bar_chart = ChartVal().parse("""
    ... type: bar
    ... label:
    ...   title: Label
    ...   expression: label_expression
    ... bars:
    ... - value: bar_expression
    ... """)

    >>> bar_chart.config.label
    Expression(title='Label', expression='label_expression')

    >>> bar_chart.config.bars
    [Record(value=Expression(title=None, expression='bar_expression'), color=undefined)]

    >>> bar_chart.expressions()
    [Expression(title='Label', expression='label_expression'), Expression(title=None, expression='bar_expression')]

Tear down the environment::

    >>> rex.off()
