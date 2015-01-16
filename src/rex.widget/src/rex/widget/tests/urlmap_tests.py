"""

    rex.widget.tests.urlmap_tests
    =============================

    :copyright: 2014, Prometheus Research, LLC

"""

from webob import Request

from rex.core import StrVal, Rex
from rex.widget import Widget, Field, StateField, IDField
from rex.widget.urlmap import WidgetRenderer


class MyWidget(Widget):

    name = 'MyWidget'
    js_type = 'rex-widget-tests/lib/MyWidget'

    id = IDField()
    label = Field(StrVal())
    value = StateField(StrVal())


app = None


def setup_function(function):
    global app
    app = Rex('-')
    app.on()


def teardown_function(function):
    global app
    app.off()
    app = None


def test_get_page_state():
    widget = MyWidget(id='widget', label='Label')
    renderer = WidgetRenderer(widget, 'access')
    req = Request.blank('/')
    req.environ['rex.access'] = {'access': True}
    req.accept = 'application/json'
    res = renderer(req)

    assert 'descriptor' in res.json

    assert 'state' in res.json['descriptor']
    assert 'widget/value' in res.json['descriptor']['state']

    assert 'ui' in res.json['descriptor']
    assert res.json['descriptor']['ui']['__type__'] == MyWidget.js_type

    assert 'versions' in res.json
    assert 'widget/value' in res.json['versions']
    assert res.json['versions']['widget/value'] == 1

    assert 'values' in res.json
    assert 'widget/value' in res.json['values']
    assert res.json['values']['widget/value'] == None


def test_get_page_state_with_values():
    widget = MyWidget(id='widget', label='Label')
    renderer = WidgetRenderer(widget, 'access')
    req = Request.blank('/?widget/value=ok')
    req.environ['rex.access'] = {'access': True}
    req.accept = 'application/json'
    res = renderer(req)

    assert 'values' in res.json
    assert 'widget/value' in res.json['values']
    assert res.json['values']['widget/value'] == 'ok'


def test_get_page_state_with_values_by_alias():
    widget = MyWidget(id='widget', label='Label')
    renderer = WidgetRenderer(widget, 'access')
    req = Request.blank('/?widget=ok')
    req.environ['rex.access'] = {'access': True}
    req.accept = 'application/json'
    res = renderer(req)

    assert 'values' in res.json
    assert 'widget/value' in res.json['values']
    assert res.json['values']['widget/value'] == 'ok'


def test_update_page_state_no_updates():
    widget = MyWidget(id='widget', label='Label')
    renderer = WidgetRenderer(widget, 'access')
    req = Request.blank('/')
    req.method = 'POST'
    req.environ['rex.access'] = {'access': True}
    req.accept = 'application/json'
    req.json = {
        'versions': {'widget/value': 2},
        'values': {'widget/value': 'nope'},
        'updates': {},
    }
    res = renderer(req)

    assert 'descriptor' in res.json
    assert res.json['descriptor'] == None

    assert 'state' in res.json
    assert 'widget/value' in res.json['state']
    assert res.json['state']['widget/value'] == 'nope'

    assert 'versions' in res.json
    assert 'widget/value' in res.json['versions']
    assert res.json['versions']['widget/value'] == 2


def test_update_page_state():
    widget = MyWidget(id='widget', label='Label')
    renderer = WidgetRenderer(widget, 'access')
    req = Request.blank('/')
    req.method = 'POST'
    req.environ['rex.access'] = {'access': True}
    req.accept = 'application/json'
    req.json = {
        'versions': {'widget/value': 2},
        'values': {},
        'updates': {'widget/value': 'nope'},
    }
    res = renderer(req)

    assert 'descriptor' in res.json
    assert res.json['descriptor'] == None

    assert 'state' in res.json
    assert 'widget/value' in res.json['state']
    assert res.json['state']['widget/value'] == 'nope'

    assert 'versions' in res.json
    assert 'widget/value' in res.json['versions']
    assert res.json['versions']['widget/value'] == 2


