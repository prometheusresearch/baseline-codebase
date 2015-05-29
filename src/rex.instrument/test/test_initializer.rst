***********
Initializer
***********


Set up the environment::

    >>> from rex.core import Rex, get_settings
    >>> from rex.db import get_db
    >>> db = get_db()


It won't do anything if there's no implementation of the interface::

    >>> rex = Rex('__main__', 'rex.instrument')


If there is an implementation, it will iterate through all InstrumentVersion
instances in the system and ensure that they contain valid definitions::

    >>> rex = Rex('__main__', 'rex.instrument_demo')

    >>> prod = db.produce("/merge(instrument:={'broken' :as uid, 'broken' :as code, 'Broken' :as title, 'active' :as status})")
    >>> prod = db.produce("""/merge(instrumentversion:={'broken1' :as uid, 'broken' :as instrument, 1 :as version, 'someone' :as published_by, '2014-05-22' :as date_published, '{"foo": "bar"}' :as definition})""")
    >>> rex.reset()
    Traceback (most recent call last):
        ...
    Error: InstrumentVersion "broken1" contains an invalid definition: The following problems were encountered when validating this Instrument:
    <root>: Unrecognized keys in mapping: "{'foo': 'bar'}"
    While initializing RexDB application:
        __main__
        rex.instrument_demo

    >>> prod = db.produce("""/merge(instrumentversion:={'broken1' :as uid, 'broken' :as instrument, 1 :as version, 'someone' :as published_by, '2014-05-22' :as date_published, '{hello' :as definition})""")
    >>> rex.reset()
    Traceback (most recent call last):
        ...
    Error: Failed to parse a YAML document:
        while parsing a flow mapping
          in "<unicode string>", line 1, column 1
        did not find expected ',' or '}'
          in "<unicode string>", line 2, column 1
    While validating system InstrumentVersions.
    While initializing RexDB application:
        __main__
        rex.instrument_demo


If the setting is disabled, the automatic validation won't occur::

    >>> rex = Rex('__main__', 'rex.instrument_demo', instrument_validate_on_startup=False)


Clean up after ourselves::

    >>> prod = db.produce("/instrumentversion[broken1]{id()}/:delete")
    >>> prod = db.produce("/instrument[broken]{id()}/:delete")

