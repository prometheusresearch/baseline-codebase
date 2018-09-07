*************
RexDB Definer
*************

Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()
    >>> from rex.mart import Definer, RexdbDefiner
    >>> definer = RexdbDefiner()

Handles definitions with nothing configured::

    >>> definer.assessments('doesntexist')
    []
    >>> Definer.get_assessments('rexdb', 'doesntexist')
    []

Handles bare essentials::

    >>> definer.assessments('dynamic_simple')
    [{'name': 'mart1', 'instrument': ['mart1'], 'selector': '/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parental_relationship': {'type': 'trunk'}, 'identifiable': 'any', 'meta': [], 'post_load_calculations': []}]

    >>> Definer.get_assessments('rexdb', 'dynamic_simple')
    [{'instrument': ['mart1'], 'name': 'mart1', 'selector': {'query': '/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parameters': {}}, 'parental_relationship': {'type': 'trunk', 'parent': []}, 'identifiable': 'any', 'fields': [], 'calculations': [], 'meta': [], 'post_load_calculations': []}]

Handles all the configuration options::

    >>> definer.assessments('dynamic_complex')
    [{'name': 'mart1', 'instrument': ['mart1'], 'selector': '/assessment{id() :as assessment_uid, subject.id() :as subject}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parental_relationship': {'type': 'branch', 'parent': ['subject']}, 'identifiable': 'any', 'meta': [], 'post_load_calculations': [{'name': 'baz', 'type': 'integer', 'expression': '(42)'}], 'fields': ['foo'], 'calculations': ['bar']}, {'name': 'mart2', 'instrument': ['mart2'], 'selector': '/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parental_relationship': {'type': 'trunk'}, 'identifiable': 'none', 'meta': [{'dateCompleted': 'dateTime'}], 'post_load_calculations': [], 'fields': None, 'calculations': None}]

    >>> Definer.get_assessments('rexdb', 'dynamic_complex')
    [{'instrument': ['mart1'], 'name': 'mart1', 'selector': {'query': '/assessment{id() :as assessment_uid, subject.id() :as subject}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parameters': {}}, 'parental_relationship': {'type': 'branch', 'parent': ['subject']}, 'identifiable': 'any', 'fields': ['foo'], 'calculations': ['bar'], 'meta': [], 'post_load_calculations': [{'name': 'baz', 'type': 'integer', 'expression': '(42)'}]}, {'instrument': ['mart2'], 'name': 'mart2', 'selector': {'query': '/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parameters': {}}, 'parental_relationship': {'type': 'trunk', 'parent': []}, 'identifiable': 'none', 'fields': None, 'calculations': None, 'meta': [{'dateCompleted': 'dateTime'}], 'post_load_calculations': []}]

Fails with invalid configuration::

    >>> definer.assessments('broken')
    [{'name': 'mart1', 'instrument': [], 'selector': 'foo', 'parental_relationship': {'type': 'trunk'}, 'identifiable': 'any', 'meta': [], 'post_load_calculations': []}]

    >>> Definer.get_assessments('rexdb', 'broken')
    Traceback (most recent call last):
        ...
    rex.core.Error: Assessment does not specify any instruments
    While validating field:
        instrument



    >>> rex.off()

