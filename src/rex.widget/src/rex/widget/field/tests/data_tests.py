"""

    rex.widget.field.tests.data_tests
    =================================

    :copyright: 2014, Prometheus Research, LLC

"""

from ..data import DataSpecVal
from ...state import Reference


def test_data_spec_val_shortcut():
    validate = DataSpecVal()

    spec = validate('/query')
    assert spec.route is None
    assert spec.query == '/query'
    assert spec.params == {}
    assert spec.refs == {}
    assert spec.defer is None

    spec = validate('pkg:/url')
    assert spec.route == 'pkg:/url'
    assert spec.query is None
    assert spec.params == {}
    assert spec.refs == {}
    assert spec.defer is None


def test_data_spec_val_url_only():
    validate = DataSpecVal()

    spec = validate({'url': '/query'})
    assert spec.route is None
    assert spec.query == '/query'
    assert spec.params == {}
    assert spec.refs == {}
    assert spec.defer is None

    spec = validate({'url': 'pkg:/url'})
    assert spec.route == 'pkg:/url'
    assert spec.query is None
    assert spec.params == {}
    assert spec.refs == {}
    assert spec.defer is None


def test_data_spec_val_with_defer():
    validate = DataSpecVal()

    spec = validate({
        'url': '/query',
        'defer': 'x'
    })
    assert spec.route is None
    assert spec.query == '/query'
    assert spec.params == {}
    assert spec.refs == {}
    assert spec.defer == 'x'

    spec = validate({
        'url': 'pkg:/url',
        'defer': 'x'
    })
    assert spec.route == 'pkg:/url'
    assert spec.query is None
    assert spec.params == {}
    assert spec.refs == {}
    assert spec.defer == 'x'


def test_data_spec_val_with_refs():
    validate = DataSpecVal()

    spec = validate({
        'url': '/query',
        'refs': {
            'param': 'value'
        }
    })

    assert spec.route is None
    assert spec.query == '/query'
    assert spec.params == {}
    assert spec.refs == {'param': (Reference('value'),)}
    assert spec.defer is None

    spec = validate({
        'url': 'pkg:/url',
        'refs': {
            'param': 'value'
        }
    })

    assert spec.route == 'pkg:/url'
    assert spec.query is None
    assert spec.params == {}
    assert spec.refs == {'param': (Reference('value'),)}
    assert spec.defer is None


def test_data_spec_val_with_multivalue_refs():
    validate = DataSpecVal()

    spec = validate({
        'url': '/query',
        'refs': {
            'param': ['value', 'value2']
        }
    })

    assert spec.route is None
    assert spec.query == '/query'
    assert spec.params == {}
    assert spec.refs == {'param': (Reference('value'), Reference('value2'))}
    assert spec.defer is None

    spec = validate({
        'url': 'pkg:/url',
        'refs': {
            'param': ['value', 'value2']
        }
    })

    assert spec.route == 'pkg:/url'
    assert spec.query is None
    assert spec.params == {}
    assert spec.refs == {'param': (Reference('value'), Reference('value2'))}
    assert spec.defer is None


def test_data_spec_val_with_predefined_params():
    validate = DataSpecVal()

    spec = validate({
        'url': '/query?nope'
    })

    assert spec.route is None
    assert spec.query == '/query?nope'
    assert spec.params == {}
    assert spec.refs == {}
    assert spec.defer is None

    spec = validate({
        'url': 'pkg:/url?some=param'
    })

    assert spec.route == 'pkg:/url'
    assert spec.query is None
    assert spec.params == {'some': ['param']}
    assert spec.refs == {}
    assert spec.defer is None
