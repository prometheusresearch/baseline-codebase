***********
Initializer
***********


Set up the environment::

    >>> from rex.core import Rex, get_settings
    >>> from rex.db import get_db


It won't do anything if there's no implementation of the interface::

    >>> rex = Rex('__main__', 'rex.instrument', db='pgsql:instrument_demo')


If there is an implementation, it will iterate through all InstrumentVersion
instances in the system and ensure that they contain valid definitions::

    >>> rex = Rex('__main__', 'rex.instrument_demo')
    >>> rex.on()
    >>> db = get_db()

    >>> prod = db.produce("/merge(instrument:={'broken' :as uid, 'broken' :as code, 'Broken' :as title, 'active' :as status})")
    >>> prod = db.produce("""/merge(instrumentversion:={'broken1' :as uid, 'broken' :as instrument, 1 :as version, 'someone' :as published_by, '2014-05-22' :as date_published, '{"foo": "bar"}' :as definition})""")
    >>> rex.reset()
    Traceback (most recent call last):
        ...
    rex.core.Error: InstrumentVersion "broken1" contains an invalid definition: The following problems were encountered when validating this Instrument:
    <root>: Unrecognized keys in mapping: "{'foo': 'bar'}"
    While initializing RexDB application:
        __main__
        rex.instrument_demo

    >>> prod = db.produce("""/merge(instrumentversion:={'broken1' :as uid, '{hello' :as definition})""")
    >>> rex.reset()  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.core.Error: Failed to parse a YAML document:
        ...
    While validating system InstrumentVersions.
    While initializing RexDB application:
        __main__
        rex.instrument_demo

    >>> prod = db.produce("""/merge(instrumentversion:={'broken1' :as uid, '{"id": "urn:foo", "version": "1.0", "title": "Foo!", "record": [{"id": "bar", "type": "text"}]}' :as definition})""")
    >>> prod = db.produce("""/merge(instrumentversion:={'broken1' :as uid, '{"foo": "bar"}' :as calculation_json})""")
    >>> rex.reset()
    Traceback (most recent call last):
        ...
    rex.core.Error: CalculationSet "broken1" contains an invalid definition: The following problems were encountered when validating this CalculationSet:
    <root>: Unrecognized keys in mapping: "{'foo': 'bar'}"
    While initializing RexDB application:
        __main__
        rex.instrument_demo


If the setting is disabled, the automatic validation won't occur::

    >>> rex = Rex('__main__', 'rex.instrument_demo', instrument_validate_on_startup=False)


Clean up after ourselves::

    >>> prod = db.produce("/instrumentversion[broken1]{id()}/:delete")
    >>> prod = db.produce("/instrument[broken]{id()}/:delete")

