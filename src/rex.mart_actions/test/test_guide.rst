********
RexGuide
********

Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_actions_demo')
    >>> rex.on()
    >>> from pprint import pprint
    >>> from functools import partial
    >>> pprint = partial(pprint, width=130)

Create a Mart to work with::

    >>> from rex.mart import MartCreator
    >>> mart = MartCreator('test', 'world')()

Validate field configurations::

    >>> from rex.mart_actions.guide import FieldConfigVal

    >>> FieldConfigVal({'include': 'foo'})
    Record(include='foo', title=None, selected=True, _type=None)

    >>> FieldConfigVal({'include': 'foo', 'title': 'The Foo', 'selected': False})
    Record(include='foo', title='The Foo', selected=False, _type=None)

    >>> FieldConfigVal({'include': 'foo.bar_baz'})
    Record(include='foo.bar_baz', title=None, selected=True, _type=None)

    >>> FieldConfigVal({'include': '*'})
    Record(include='*', title=None, selected=True, _type=None)

    >>> FieldConfigVal({'exclude': 'foo'})
    Record(exclude='foo')

    >>> FieldConfigVal({'exclude': 'foo.bar_baz'})
    Record(exclude='foo.bar_baz')

    >>> FieldConfigVal({'expression': 'count(foo)', 'title': 'Number of Foos'})
    Record(expression=<FunctionSyntax count(foo)>, title='Number of Foos', selected=True)

    >>> FieldConfigVal({'expression': 'count(foo)', 'title': 'Number of Foos', 'selected': False})
    Record(expression=<FunctionSyntax count(foo)>, title='Number of Foos', selected=False)

    >>> FieldConfigVal({'expression': 'count(foo)'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing mandatory field:
        title

    >>> FieldConfigVal({'title': 'What?'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected one of:
        include record
        exclude record
        expression record
    Got:
        {'title': 'What?'}

    >>> FieldConfigVal({'include': '/blah'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a string matching:
        /^([\w]+|\*)(\.([\w]+|\*))*$/
    Got:
        '/blah'
    While validating field:
        include

    >>> FieldConfigVal({'include': 'round(foo)'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a string matching:
        /^([\w]+|\*)(\.([\w]+|\*))*$/
    Got:
        'round(foo)'
    While validating field:
        include

    >>> FieldConfigVal({'exclude': '/blah'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected a string matching:
        /^[\w]+(\.[\w]+)*$/
    Got:
        '/blah'
    While validating field:
        exclude

Generate field specifications based on field configurations::

    >>> from rex.mart_actions.guide import GuideConfiguration

    >>> gc = GuideConfiguration(mart.get_htsql(), 'city')
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'Id', 'type': 'integer'},
     {'selected': True, 'title': 'Name', 'type': 'text'},
     {'selected': True, 'title': 'Country', 'type': 'identity'},
     {'selected': True, 'title': 'District', 'type': 'text'},
     {'selected': True, 'title': 'Population', 'type': 'integer'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'Id', 'type': 'integer'},
     {'selected': True, 'title': 'Name', 'type': 'text'},
     {'selected': True, 'title': 'Country', 'type': 'identity'},
     {'selected': True, 'title': 'District', 'type': 'text'},
     {'selected': True, 'title': 'Population', 'type': 'integer'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'district', 'selected': False}),
    ...     FieldConfigVal({'include': 'doesntexist'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'Id', 'type': 'integer'},
     {'selected': True, 'title': 'Name', 'type': 'text'},
     {'selected': True, 'title': 'Country', 'type': 'identity'},
     {'selected': False, 'title': 'District', 'type': 'text'},
     {'selected': True, 'title': 'Population', 'type': 'integer'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': 'district', 'title': 'The District'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'The District', 'type': 'text'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'name', 'title': 'Retitled Name!'}),
    ...     FieldConfigVal({'exclude': 'population'}),
    ...     FieldConfigVal({'exclude': 'id'}),
    ...     FieldConfigVal({'include': 'district', 'selected': False}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'Retitled Name!', 'type': 'text'},
     {'selected': True, 'title': 'Country', 'type': 'identity'},
     {'selected': False, 'title': 'District', 'type': 'text'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'country.continent'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'Id', 'type': 'integer'},
     {'selected': True, 'title': 'Name', 'type': 'text'},
     {'selected': True, 'title': 'Country', 'type': 'identity'},
     {'selected': True, 'title': 'District', 'type': 'text'},
     {'selected': True, 'title': 'Population', 'type': 'integer'},
     {'selected': True, 'title': 'Continent', 'type': 'enum'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'country.*'}),
    ...     FieldConfigVal({'exclude': 'country.surface_area'}),
    ...     FieldConfigVal({'exclude': 'country.independence_year'}),
    ...     FieldConfigVal({'exclude': 'doesnt_exist.foo'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'Id', 'type': 'integer'},
     {'selected': True, 'title': 'Name', 'type': 'text'},
     {'selected': True, 'title': 'Country', 'type': 'identity'},
     {'selected': True, 'title': 'District', 'type': 'text'},
     {'selected': True, 'title': 'Population', 'type': 'integer'},
     {'selected': True, 'title': 'Code', 'type': 'text'},
     {'selected': True, 'title': 'Name', 'type': 'text'},
     {'selected': True, 'title': 'Continent', 'type': 'enum'},
     {'selected': True, 'title': 'Region', 'type': 'text'},
     {'selected': True, 'title': 'Population', 'type': 'integer'},
     {'selected': True, 'title': 'Life Expectancy', 'type': 'decimal'},
     {'selected': True, 'title': 'Gnp', 'type': 'decimal'},
     {'selected': True, 'title': 'Gnp Old', 'type': 'decimal'},
     {'selected': True, 'title': 'Local Name', 'type': 'text'},
     {'selected': True, 'title': 'Government Form', 'type': 'text'},
     {'selected': True, 'title': 'Head Of State', 'type': 'text'},
     {'selected': True, 'title': 'Capital City', 'type': 'integer'},
     {'selected': True, 'title': 'Code2', 'type': 'text'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'expression': 'count(country.country_language)', 'title': '# Languages in Country'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': 'Id', 'type': 'integer'},
     {'selected': True, 'title': 'Name', 'type': 'text'},
     {'selected': True, 'title': 'Country', 'type': 'identity'},
     {'selected': True, 'title': 'District', 'type': 'text'},
     {'selected': True, 'title': 'Population', 'type': 'integer'},
     {'selected': True, 'title': '# Languages in Country', 'type': 'integer'}]

    >>> gc.get_htsql([], [])
    "/city{id :as 'Id', name :as 'Name', country :as 'Country', district :as 'District', population :as 'Population', count(country.country_language) :as '# Languages in Country'}"

    >>> gc.get_htsql([0,3,5,999], [])
    "/city{id :as 'Id', district :as 'District', count(country.country_language) :as '# Languages in Country'}"

Validate filter configurations::

    >>> from rex.mart_actions.guide import FilterConfigVal

    >>> FilterConfigVal({'expression': 'foo', 'title': 'Some Foo'})
    Record(expression=<IdentifierSyntax foo>, title='Some Foo')

    >>> FilterConfigVal({'expression': 'foo', 'title': 'Some Foo'})
    Record(expression=<IdentifierSyntax foo>, title='Some Foo')

    >>> FilterConfigVal({'expression': 'foo'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing mandatory field:
        title

Generate filter specifications based on filter configurations::

    >>> gc = GuideConfiguration(mart.get_htsql(), 'city')
    >>> pprint(gc.get_filter_specs())
    [{'title': 'Id', 'type': 'integer'},
     {'title': 'Name', 'type': 'text'},
     {'title': 'District', 'type': 'text'},
     {'title': 'Population', 'type': 'integer'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': 'name'}),
    ... ]
    >>> filter_cfg = [
    ...     FilterConfigVal({'expression': 'name', 'title': 'Name (Text)'}),
    ...     FilterConfigVal({'expression': '!is_null(district)', 'title': 'Has a District (Bool)'}),
    ...     FilterConfigVal({'expression': 'population', 'title': 'Population (Integer)'}),
    ...     FilterConfigVal({'expression': 'country.gnp', 'title': 'GNP (Decimal)'}),
    ...     FilterConfigVal({'expression': 'float(country.gnp)', 'title': 'GNP (Float)'}),
    ...     FilterConfigVal({'expression': 'country.continent', 'title': 'Continent (Enum)'}),
    ...     FilterConfigVal({'expression': 'now()', 'title': 'Now (DateTime)'}),
    ...     FilterConfigVal({'expression': 'time(now())', 'title': 'Now (Time)'}),
    ...     FilterConfigVal({'expression': 'today()', 'title': 'Today (Date)'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_config=field_cfg, filter_config=filter_cfg)
    >>> pprint(gc.get_filter_specs())
    [{'title': 'Name (Text)', 'type': 'text'},
     {'title': 'Has a District (Bool)', 'type': 'boolean'},
     {'title': 'Population (Integer)', 'type': 'integer'},
     {'title': 'GNP (Decimal)', 'type': 'decimal'},
     {'title': 'GNP (Float)', 'type': 'float'},
     {'enumerations': ['asia', 'europe', 'north_america', 'africa', 'oceania', 'antarctica', 'south_america'],
      'title': 'Continent (Enum)',
      'type': 'enum'},
     {'title': 'Now (DateTime)', 'type': 'datetime'},
     {'title': 'Now (Time)', 'type': 'time'},
     {'title': 'Today (Date)', 'type': 'date'}]

    >>> gc.get_htsql([0], [
    ...     {'id': 0, 'value': 'foo'},
    ...     {'id': 1, 'value': True},
    ...     {'id': 2, 'value': 10, 'op': '>'},
    ...     {'id': 2, 'value': 100, 'op': '<'},
    ...     {'id': 3, 'value': 1.3, 'op': '>'},
    ...     {'id': 4, 'value': 10.4, 'op': '<'},
    ...     {'id': 5, 'value': ['asia', 'africa']},
    ...     {'id': 6, 'value': '2001-01-01 20:12:23', 'op': '>'},
    ...     {'id': 7, 'value': '20:12:23', 'op': '<='},
    ...     {'id': 8, 'value': '2001-01-01', 'op': '!='},
    ...     {'id': 999, 'value': 'foo'},
    ... ])
    "/city{name :as 'Name'}.filter((name)~'foo').filter((!is_null(district))=true()).filter((population)>10).filter((population)<100).filter((country.gnp)>1.3).filter((float(country.gnp))<10.4).filter((country.continent)={'asia','africa'}).filter((now())>datetime('2001-01-01 20:12:23')).filter((time(now()))<=time('20:12:23')).filter((today())!=date('2001-01-01'))"

Masks always come as part of the query::

    >>> mask_cfg = [
    ...     'population>12345',
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_config=field_cfg, filter_config=filter_cfg, mask_config=mask_cfg)

    >>> gc.get_htsql([0], [])
    "/city{name :as 'Name'}.filter(population>12345)"

    >>> gc.get_htsql([0], [{'id': 0, 'value': 'foo'}])
    "/city{name :as 'Name'}.filter((name)~'foo').filter(population>12345)"

Sorting and limiting::

    >>> gc = GuideConfiguration(mart.get_htsql(), 'city')

    >>> gc.get_htsql([1], limit=10)
    "/city{name :as 'Name'}.limit(10)"

    >>> gc.get_htsql([1], limit=10, offset=4)
    "/city{name :as 'Name'}.limit(10, 4)"

    >>> sort_cfg = [
    ...     {'id': 4, 'dir': 'desc'},
    ...     {'id': 0, 'dir': 'asc'},
    ... ]
    >>> gc.get_htsql([1], sort_config=sort_cfg)
    "/city{name :as 'Name'}.sort(population-, id)"

    >>> sort_cfg = [
    ...     {'id': 999, 'dir': 'desc'},
    ... ]
    >>> gc.get_htsql([1], sort_config=sort_cfg)
    "/city{name :as 'Name'}"

Validate exporter configurations::

    >>> from rex.mart_actions.guide import GuideExporterVal
    >>> validator = GuideExporterVal()

    >>> validator('xls')
    {'name': 'xls', 'title': 'Microsoft Excel (XLS)', 'mime_type': 'application/vnd.ms-excel'}

    >>> validator('csv')
    {'name': 'csv', 'title': 'Comma-Separated Values (CSV)', 'mime_type': 'text/csv'}

    >>> validator('doesntexist')
    Traceback (most recent call last):
        ...
    rex.core.Error: Unknown GuideExporter "doesntexist"

Clean up::

    >>> from rex.mart import purge_mart
    >>> purge_mart(mart.code)


