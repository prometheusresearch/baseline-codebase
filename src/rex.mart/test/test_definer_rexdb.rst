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
    [{'post_load_calculations': [], 'name': u'mart1', 'identifiable': u'any', 'parental_relationship': {'type': u'trunk'}, 'selector': u'/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'instrument': [u'mart1'], 'meta': []}]

    >>> Definer.get_assessments('rexdb', 'dynamic_simple')
    [{'post_load_calculations': [], 'name': 'mart1', 'identifiable': 'any', 'parental_relationship': {'type': 'trunk', 'parent': []}, 'selector': {'query': '/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parameters': {}}, 'instrument': ['mart1'], 'meta': [], 'calculations': [], 'fields': []}]

Handles all the configuration options::

    >>> definer.assessments('dynamic_complex')
    [{'post_load_calculations': [{'expression': u'(42)', 'type': u'integer', 'name': u'baz'}], 'name': u'mart1', 'identifiable': u'any', 'parental_relationship': {'type': u'branch', 'parent': [u'subject']}, 'selector': u'/assessment{id() :as assessment_uid, subject.id() :as subject}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'instrument': [u'mart1'], 'meta': [], 'calculations': [u'bar'], 'fields': [u'foo']}, {'post_load_calculations': [], 'name': u'mart2', 'identifiable': u'none', 'parental_relationship': {'type': u'trunk'}, 'selector': u'/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'instrument': [u'mart2'], 'meta': [{u'dateCompleted': u'dateTime'}], 'calculations': None, 'fields': None}]

    >>> Definer.get_assessments('rexdb', 'dynamic_complex')
    [{'post_load_calculations': [{'expression': '(42)', 'type': 'integer', 'name': 'baz'}], 'name': 'mart1', 'identifiable': 'any', 'parental_relationship': {'type': 'branch', 'parent': ['subject']}, 'selector': {'query': '/assessment{id() :as assessment_uid, subject.id() :as subject}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parameters': {}}, 'instrument': ['mart1'], 'meta': [], 'calculations': ['bar'], 'fields': ['foo']}, {'post_load_calculations': [], 'name': 'mart2', 'identifiable': 'none', 'parental_relationship': {'type': 'trunk', 'parent': []}, 'selector': {'query': '/assessment{id() :as assessment_uid}.filter(instrumentversion.instrument=$INSTRUMENT)/:rexdb', 'parameters': {}}, 'instrument': ['mart2'], 'meta': [{'dateCompleted': 'dateTime'}], 'calculations': None, 'fields': None}]

Fails with invalid configuration::

    >>> definer.assessments('broken')
    [{'post_load_calculations': [], 'name': u'mart1', 'identifiable': u'any', 'parental_relationship': {'type': u'trunk'}, 'selector': u'foo', 'instrument': [], 'meta': []}]

    >>> Definer.get_assessments('rexdb', 'broken')
    Traceback (most recent call last):
        ...
    Error: Assessment does not specify any instruments
    While validating field:
        instrument



    >>> rex.off()

