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
from .entity_action import EntityAction

__all__ = ('Plotly',)


class Plotly(Action):
    """Draw plots with plotly library.

    Basic usage example::

        type: plotly
        title: Gender

        plot:
            type: bar
            name: Gender (All participant)

        query: |
            /individual^sex{sex :as x, count(^) :as y}

    This plots a barchart using data from ``query`` field.

    The ``plot`` field is a Plotly configuration for a plot (you can find docs
    about possible parameters at `<https://plot.ly/javascript/reference>`_).

    The ``query`` field is an HTSQL query which returns data to plot. Note that
    ``x`` and ``y`` are required for ``barchar`` plot type as specified in
    plotly docs at `<https://plot.ly/javascript/reference>`_.

    More sophisticated example which renders multiple datasets at once::

          type: plotly
          title: Gender (Bar Chart, multiple traces)

          layout:
            barmode: group

          plot:
            all:
              type: bar
              name: All
            recruited:
              type: bar
              name: Recruited
            enrolled:
              type: bar
              name: Enrolled

          query: |
            {
              all := /individual^sex{sex :as x, count(^) :as y},
              recruited := /study_recruitment^individual.sex{sex :as x, count(^) :as y},
              enrolled := /study_enrollment^individual.sex{sex :as x, count(^) :as y}
            }

    Note here we defined multiple queries in ``query`` field and multiple plot
    configurations in ``plot`` fields. Each plot key must correspond to query
    key.

    Another example which renders a plot using a query which refers to a context
    variable::

          type: plotly
          title: Gender By Study Recruitment

          input:
          - study: study

          plot:
            type: pie

          query: |
            /study_recruitment?study=$study^individual.sex{sex :as label, count(^) :as value}


    Note that to refer to context variables in ``query`` we need to define
    ``input`` field with context requirements.
    """

    name = 'plotly'
    js_type = 'rex-action', 'Plotly'

    input = EntityAction.input.__clone__()

    query = Field(
        SyntaxVal(), transitionable=False,
        doc="""
        HTSQL query which produces data for plot

        There are requirements which are imposed by specified plot type in
        ``plot`` field.

        For example for ``barchart`` plot type where should be ``x`` and ``y``
        fields present in dataset. For ``pie`` - ``labels`` and ``values``.

        Consult Plotly docs at `<https://plot.ly/javascript/reference>`_ for more
        info.
        """)

    plot = Field(
        AnyVal(), default={},
        doc="""
        Plot configuration

        Consult Plotly docs at `<https://plot.ly/javascript/reference>`_ for more
        info.

        Note that ``data array`` attributes are specified through ``query``
        field as they need to be fetched from database with HTSQL query and not
        specified in configuration as static values.
        """)

    layout = Field(
        AnyVal(), default={},
        doc="""
        Layout configuration

        Consult Plotly docs at `<https://plot.ly/javascript/reference>`_ for more
        info (Layout section specifically).
        """)

    @responder(url_type=QueryURL)
    def data(self, req):
        query = Query(self.query)
        return query(req)

    def context(self):
        input = self.input if self.input.rows else self.domain.record()
        output = self.domain.record()
        return input, output
