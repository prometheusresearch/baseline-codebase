"""

    rex.widget.field.tests.collection_tests
    =======================================

    :copyright: 2014, Prometheus Research, LLC

"""

import mock

from rex.core import Rex
from rex.widget.state import StateGraphComputation, MutableStateGraph
from rex.widget.field.data import Data, DataSpec
from rex.widget.field.collection import CollectionField


app = None


def setup_module(module):
    global app
    app = Rex('rex.widget_demo')
    app.on()


def teardown_module(module):
    global app
    app.off()


graph = None
widget = None
request = None


def setup_function(function):
    global graph, widget, request
    graph = MutableStateGraph()
    widget = mock.Mock()
    widget.id = 'widget_id'
    request = mock.Mock()


def teardown_function(function):
    global graph, widget, request
    graph = None
    widget = None
    request = None


def make_spec(route=None, query=None, params=None, refs=None, defer=None):
    return DataSpec(
        route=route,
        query=query,
        params=params or {},
        refs=refs or {},
        defer=defer)


def make_computation(spec, field=None):
    if field is None:
        field = CollectionField()
    _, state = field.describe('field_name', spec, widget)[0]
    graph.update({state.id: state})
    return StateGraphComputation(graph, request)


def test_describes_state():
    field = CollectionField()
    spec = make_spec(query='somequery')
    states = field.describe('field_name', spec, widget)
    assert len(states) == 1
    name, state = states[0]
    assert name == 'field_name'
    assert state.id == 'widget_id/field_name'


def test_computes_via_inline_query():
    spec = make_spec(query='/study')
    computation = make_computation(spec)
    data = computation['widget_id/field_name']
    assert isinstance(data, Data)
    assert data.id == 'widget_id/field_name'
    assert len(data.data) == 3
    assert data.meta is None
    assert data.has_more == False


def test_computes_via_inline_query_with_meta():
    field = CollectionField(include_meta=True)
    spec = make_spec(query='/study')
    computation = make_computation(spec, field=field)
    assert computation['widget_id/field_name'].meta is not None


def test_computes_via_predefined_query():
    spec = make_spec(route='rex.widget_demo:/query/study')
    computation = make_computation(spec)
    data = computation['widget_id/field_name']
    assert isinstance(data, Data)
    assert data.id == 'widget_id/field_name'
    assert len(data.data) == 3
    assert data.meta is None
    assert data.has_more == False


def test_computes_via_predefined_query_with_meta():
    field = CollectionField(include_meta=True)
    spec = make_spec(route='rex.widget_demo:/query/study')
    computation = make_computation(spec, field=field)
    assert computation['widget_id/field_name'].meta is not None


def test_computes_via_predefined_port():
    spec = make_spec(route='rex.widget_demo:/port/study')
    computation = make_computation(spec)
    data = computation['widget_id/field_name']
    assert isinstance(data, Data)
    assert data.id == 'widget_id/field_name'
    assert len(data.data) == 3
    assert data.meta is None
    assert data.has_more == False


def test_computes_via_predefined_port_with_meta():
    field = CollectionField(include_meta=True)
    spec = make_spec(route='rex.widget_demo:/port/study')
    computation = make_computation(spec, field=field)
    assert computation['widget_id/field_name'].meta is not None
