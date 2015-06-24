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
    Record(include=u'foo', title=None, selected=True, _type=None)

    >>> FieldConfigVal({'include': 'foo', 'title': 'The Foo', 'selected': False})
    Record(include=u'foo', title=u'The Foo', selected=False, _type=None)

    >>> FieldConfigVal({'include': 'foo.bar_baz'})
    Record(include=u'foo.bar_baz', title=None, selected=True, _type=None)

    >>> FieldConfigVal({'include': '*'})
    Record(include=u'*', title=None, selected=True, _type=None)

    >>> FieldConfigVal({'exclude': 'foo'})
    Record(exclude=u'foo')

    >>> FieldConfigVal({'exclude': 'foo.bar_baz'})
    Record(exclude=u'foo.bar_baz')

    >>> FieldConfigVal({'expression': 'count(foo)', 'title': 'Number of Foos'})
    Record(expression=<FunctionSyntax count(foo)>, title=u'Number of Foos', selected=True)

    >>> FieldConfigVal({'expression': 'count(foo)', 'title': 'Number of Foos', 'selected': False})
    Record(expression=<FunctionSyntax count(foo)>, title=u'Number of Foos', selected=False)

    >>> FieldConfigVal({'expression': 'count(foo)'})
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        title

    >>> FieldConfigVal({'title': 'What?'})
    Traceback (most recent call last):
        ...
    Error: Expected one of:
        include record
        exclude record
        expression record
    Got:
        {'title': 'What?'}

    >>> FieldConfigVal({'include': '/blah'})
    Traceback (most recent call last):
        ...
    Error: Expected a string matching:
        /^([\w]+|\*)(\.([\w]+|\*))*$/
    Got:
        '/blah'
    While validating field:
        include

    >>> FieldConfigVal({'include': 'round(foo)'})
    Traceback (most recent call last):
        ...
    Error: Expected a string matching:
        /^([\w]+|\*)(\.([\w]+|\*))*$/
    Got:
        'round(foo)'
    While validating field:
        include

    >>> FieldConfigVal({'exclude': '/blah'})
    Traceback (most recent call last):
        ...
    Error: Expected a string matching:
        /^[\w]+(\.[\w]+)*$/
    Got:
        '/blah'
    While validating field:
        exclude

Generate field specifications based on field configurations::

    >>> from rex.mart_actions.guide import GuideConfiguration

    >>> gc = GuideConfiguration(mart.get_htsql(), 'city')
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'Id', 'type': u'integer'},
     {'selected': True, 'title': u'Name', 'type': u'text'},
     {'selected': True, 'title': u'Country', 'type': u'identity'},
     {'selected': True, 'title': u'District', 'type': u'text'},
     {'selected': True, 'title': u'Population', 'type': u'integer'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'Id', 'type': u'integer'},
     {'selected': True, 'title': u'Name', 'type': u'text'},
     {'selected': True, 'title': u'Country', 'type': u'identity'},
     {'selected': True, 'title': u'District', 'type': u'text'},
     {'selected': True, 'title': u'Population', 'type': u'integer'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'district', 'selected': False}),
    ...     FieldConfigVal({'include': 'doesntexist'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'Id', 'type': u'integer'},
     {'selected': True, 'title': u'Name', 'type': u'text'},
     {'selected': True, 'title': u'Country', 'type': u'identity'},
     {'selected': False, 'title': u'District', 'type': u'text'},
     {'selected': True, 'title': u'Population', 'type': u'integer'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': 'district', 'title': u'The District'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'The District', 'type': u'text'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'name', 'title': 'Retitled Name!'}),
    ...     FieldConfigVal({'exclude': 'population'}),
    ...     FieldConfigVal({'exclude': 'id'}),
    ...     FieldConfigVal({'include': 'district', 'selected': False}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'Retitled Name!', 'type': u'text'},
     {'selected': True, 'title': u'Country', 'type': u'identity'},
     {'selected': False, 'title': u'District', 'type': u'text'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'country.continent'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'Id', 'type': u'integer'},
     {'selected': True, 'title': u'Name', 'type': u'text'},
     {'selected': True, 'title': u'Country', 'type': u'identity'},
     {'selected': True, 'title': u'District', 'type': u'text'},
     {'selected': True, 'title': u'Population', 'type': u'integer'},
     {'selected': True, 'title': u'Continent', 'type': u'enum'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'include': 'country.*'}),
    ...     FieldConfigVal({'exclude': 'country.surface_area'}),
    ...     FieldConfigVal({'exclude': 'country.independence_year'}),
    ...     FieldConfigVal({'exclude': 'doesnt_exist.foo'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'Id', 'type': u'integer'},
     {'selected': True, 'title': u'Name', 'type': u'text'},
     {'selected': True, 'title': u'Country', 'type': u'identity'},
     {'selected': True, 'title': u'District', 'type': u'text'},
     {'selected': True, 'title': u'Population', 'type': u'integer'},
     {'selected': True, 'title': u'Code', 'type': u'text'},
     {'selected': True, 'title': u'Name', 'type': u'text'},
     {'selected': True, 'title': u'Continent', 'type': u'enum'},
     {'selected': True, 'title': u'Region', 'type': u'text'},
     {'selected': True, 'title': u'Population', 'type': u'integer'},
     {'selected': True, 'title': u'Life Expectancy', 'type': u'decimal'},
     {'selected': True, 'title': u'Gnp', 'type': u'decimal'},
     {'selected': True, 'title': u'Gnp Old', 'type': u'decimal'},
     {'selected': True, 'title': u'Local Name', 'type': u'text'},
     {'selected': True, 'title': u'Government Form', 'type': u'text'},
     {'selected': True, 'title': u'Head Of State', 'type': u'text'},
     {'selected': True, 'title': u'Capital City', 'type': u'integer'},
     {'selected': True, 'title': u'Code2', 'type': u'text'}]

    >>> field_cfg = [
    ...     FieldConfigVal({'include': '*'}),
    ...     FieldConfigVal({'expression': 'count(country.country_language)', 'title': '# Languages in Country'}),
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_cfg)
    >>> pprint(gc.get_field_specs())
    [{'selected': True, 'title': u'Id', 'type': u'integer'},
     {'selected': True, 'title': u'Name', 'type': u'text'},
     {'selected': True, 'title': u'Country', 'type': u'identity'},
     {'selected': True, 'title': u'District', 'type': u'text'},
     {'selected': True, 'title': u'Population', 'type': u'integer'},
     {'selected': True, 'title': u'# Languages in Country', 'type': u'integer'}]

    >>> gc.get_htsql([], [])
    u"/city{id :as 'Id', name :as 'Name', country :as 'Country', district :as 'District', population :as 'Population', count(country.country_language) :as '# Languages in Country'}"

    >>> gc.get_htsql([0,3,5,999], [])
    u"/city{id :as 'Id', district :as 'District', count(country.country_language) :as '# Languages in Country'}"

Validate filter configurations::

    >>> from rex.mart_actions.guide import FilterConfigVal

    >>> FilterConfigVal({'expression': 'foo', 'title': 'Some Foo'})
    Record(expression=<IdentifierSyntax foo>, title=u'Some Foo')

    >>> FilterConfigVal({'expression': 'foo', 'title': 'Some Foo'})
    Record(expression=<IdentifierSyntax foo>, title=u'Some Foo')

    >>> FilterConfigVal({'expression': 'foo'})
    Traceback (most recent call last):
        ...
    Error: Missing mandatory field:
        title

Generate filter specifications based on filter configurations::

    >>> gc = GuideConfiguration(mart.get_htsql(), 'city')
    >>> pprint(gc.get_filter_specs())
    [{'title': u'Id', 'type': u'integer'},
     {'title': u'Name', 'type': u'text'},
     {'title': u'District', 'type': u'text'},
     {'title': u'Population', 'type': u'integer'}]

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
    [{'title': u'Name (Text)', 'type': u'text'},
     {'title': u'Has a District (Bool)', 'type': u'boolean'},
     {'title': u'Population (Integer)', 'type': u'integer'},
     {'title': u'GNP (Decimal)', 'type': u'decimal'},
     {'title': u'GNP (Float)', 'type': u'float'},
     {'enumerations': [u'asia', u'europe', u'north_america', u'africa', u'oceania', u'antarctica', u'south_america'],
      'title': u'Continent (Enum)',
      'type': 'enum'},
     {'title': u'Now (DateTime)', 'type': u'datetime'},
     {'title': u'Now (Time)', 'type': u'time'},
     {'title': u'Today (Date)', 'type': u'date'}]

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
    u"/city{name :as 'Name'}.filter((name)~'foo').filter((!is_null(district))=true()).filter((population)>10).filter((population)<100).filter((country.gnp)>1.3).filter((float(country.gnp))<10.4).filter((country.continent)={'asia','africa'}).filter((now())>datetime('2001-01-01 20:12:23')).filter((time(now()))<=time('20:12:23')).filter((today())!=date('2001-01-01'))"

Masks always come as part of the query::

    >>> mask_cfg = [
    ...     'population>12345',
    ... ]
    >>> gc = GuideConfiguration(mart.get_htsql(), 'city', field_config=field_cfg, filter_config=filter_cfg, mask_config=mask_cfg)

    >>> gc.get_htsql([0], [])
    u"/city{name :as 'Name'}.filter(population>12345)"

    >>> gc.get_htsql([0], [{'id': 0, 'value': 'foo'}])
    u"/city{name :as 'Name'}.filter((name)~'foo').filter(population>12345)"

Sorting and limiting::

    >>> gc = GuideConfiguration(mart.get_htsql(), 'city')

    >>> gc.get_htsql([1], limit=10)
    u"/city{name :as 'Name'}.limit(10)"

    >>> gc.get_htsql([1], limit=10, offset=4)
    u"/city{name :as 'Name'}.limit(10, 4)"

    >>> sort_cfg = [
    ...     {'id': 4, 'dir': 'desc'},
    ...     {'id': 0, 'dir': 'asc'},
    ... ]
    >>> gc.get_htsql([1], sort_config=sort_cfg)
    u"/city{name :as 'Name'}.sort(population-, id)"

    >>> sort_cfg = [
    ...     {'id': 999, 'dir': 'desc'},
    ... ]
    >>> gc.get_htsql([1], sort_config=sort_cfg)
    u"/city{name :as 'Name'}"

Validate exporter configurations::

    >>> from rex.mart_actions.guide import GuideExporterVal
    >>> validator = GuideExporterVal()

    >>> validator('xls')
    {'name': 'xls', 'mime_type': 'application/vnd.ms-excel', 'title': 'Microsoft Excel (XLS)'}

    >>> validator('csv')
    {'name': 'csv', 'mime_type': 'text/csv', 'title': 'Comma-Separated Values (CSV)'}

    >>> validator('doesntexist')
    Traceback (most recent call last):
        ...
    Error: Unknown GuideExporter "doesntexist"

Clean up::

    >>> from rex.mart import purge_mart
    >>> purge_mart(mart.code)
