***********
Initializer
***********


Set up the environment::

    >>> from rex.core import Rex, get_settings
    >>> from rex.db import get_db


It won't do anything if there's no implementation of the interface::

    >>> rex = Rex('__main__', 'rex.mobile', db='pgsql:mobile_demo')


If there is an implementation, it will iterate through all Interaction
instances in the system and ensure that they contain valid configurations::

    >>> rex = Rex('__main__', 'rex.mobile_demo')

    >>> rex.on()
    >>> db = get_db()
    >>> prod = db.produce("/merge(instrument:={'broken' :as uid, 'broken' :as code, 'Broken' :as title, 'active' :as status})")
    >>> prod = db.produce("""/merge(instrumentversion:={'broken1' :as uid, 'broken' :as instrument, 1 :as version, 'someone' :as published_by, '2014-05-22' :as date_published, '{"id": "urn:test-instrument", "version": "1.1", "title": "The InstrumentVersion Title", "record": [{"id": "q_fake", "type": "text"}]}' :as definition})""")
    >>> prod = db.produce("""/merge(interaction:={'broken1mobile' :as uid, 'mobile' :as channel, 'broken1' :as instrumentversion, '{"foo": "bar"}' :as configuration})""")

    >>> rex.reset()
    Traceback (most recent call last):
        ...
    Error: Interaction "broken1mobile" contains an invalid configuration: The following problems were encountered when validating this Interaction:
    <root>: Unrecognized keys in mapping: "{'foo': 'bar'}"
    While initializing RexDB application:
        __main__
        rex.mobile_demo

    >>> prod = db.produce("""/merge(interaction:={'broken1mobile' :as uid, 'entry' :as channel, 'broken1' :as instrumentversion, '{hello' :as configuration})""")

    >>> rex.reset()  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    Error: Failed to parse a YAML document:
        ...
    While validating system Interactions.
    While initializing RexDB application:
        __main__
        rex.mobile_demo


If the setting is disabled, the automatic validation won't occur::

    >>> rex = Rex('__main__', 'rex.mobile_demo', mobile_validate_on_startup=False)


Clean up after ourselves::

    >>> prod = db.produce("/interaction[broken1mobile]{id()}/:delete")
    >>> prod = db.produce("/instrumentversion[broken1]{id()}/:delete")
    >>> prod = db.produce("/instrument[broken]{id()}/:delete")

