*************
Lookup Widget
*************

.. contents:: Table of Contents


Set up the environment::

    >>> from copy import deepcopy
    >>> from pprint import pprint
    >>> from rex.forms import Form
    >>> from rex.forms.implementation import lookup
    >>> from rex.core import Rex
    >>> from webob import Request

    >>> INSTRUMENT = {
    ...     'id': 'urn:lookup-test',
    ...     'version': '1.0',
    ...     'title': 'Lookup Test',
    ...     'record': [
    ...         {
    ...             'id': 'field1',
    ...             'type': 'text'
    ...         },
    ...         {
    ...             'id': 'field2',
    ...             'type': 'integer'
    ...         },
    ...         {
    ...             'id': 'field3',
    ...             'type': {
    ...                 'base': 'recordList',
    ...                 'record': [
    ...                     {
    ...                         'id': 'subfield1',
    ...                         'type': 'text',
    ...                     },
    ...                     {
    ...                         'id': 'subfield2',
    ...                         'type': 'text',
    ...                     },
    ...                 ],
    ...             },
    ...         },
    ...     ],
    ... }

    >>> FORM = {
    ...     'instrument': {
    ...         'id': 'urn:lookup-test',
    ...         'version': '1.0',
    ...     },
    ...     'defaultLocalization': 'en',
    ...     'pages': [
    ...         {
    ...             'id': 'page1',
    ...             'elements': [
    ...                 {
    ...                     'type': 'header',
    ...                     'options': {
    ...                         'text': {
    ...                             'en': 'Hello',
    ...                         },
    ...                     },
    ...                 },
    ...                 {
    ...                     'type': 'question',
    ...                     'options': {
    ...                         'fieldId': 'field1',
    ...                         'text': {
    ...                             'en': 'My Field',
    ...                         },
    ...                         'widget': {
    ...                             'type': 'lookupText',
    ...                             'options': {
    ...                                 'query': '/instrument{uid :as value, title :as label}.guard($search, filter(uid~$search|title~$search))',
    ...                             },
    ...                         },
    ...                     },
    ...                 },
    ...                 {
    ...                     'type': 'question',
    ...                     'options': {
    ...                         'fieldId': 'field2',
    ...                         'text': {
    ...                             'en': 'My Other Field',
    ...                         },
    ...                     },
    ...                 },
    ...                 {
    ...                     'type': 'question',
    ...                     'options': {
    ...                         'fieldId': 'field3',
    ...                         'text': {
    ...                             'en': 'My RecordList Field',
    ...                         },
    ...                         'questions': [
    ...                             {
    ...                                 'fieldId': 'subfield1',
    ...                                 'text': {
    ...                                     'en': 'Sub1',
    ...                                 },
    ...                                 'widget': {
    ...                                     'type': 'lookupText',
    ...                                     'options': {
    ...                                         'query': '/instrument{uid :as value, upper(title) :as label}.guard($search, filter(uid~$search|title~$search))',
    ...                                     },
    ...                                 },
    ...                             },
    ...                             {
    ...                                 'fieldId': 'subfield2',
    ...                                 'text': {
    ...                                     'en': 'Sub2',
    ...                                 },
    ...                             },
    ...                         ],
    ...                     },
    ...                 },
    ...             ]
    ...         }
    ...     ],
    ... }


Validation
==========

The Form validation routine will make sure you have query specified for
``lookupText``-based questions::

    >>> Form.validate_configuration(FORM, instrument_definition=INSTRUMENT)

    >>> BROKEN = deepcopy(FORM)
    >>> BROKEN['pages'][0]['elements'][1]['options']['widget']['options']['query'] = None
    >>> Form.validate_configuration(BROKEN, instrument_definition=INSTRUMENT)
    Traceback (most recent call last):
        ...
    ValidationError: Widget configuration for field1 is missing query

    >>> del BROKEN['pages'][0]['elements'][1]['options']['widget']['options']
    >>> Form.validate_configuration(BROKEN, instrument_definition=INSTRUMENT)
    Traceback (most recent call last):
        ...
    ValidationError: Widget configuration for field1 is missing query

    >>> BROKEN = deepcopy(FORM)
    >>> BROKEN['pages'][0]['elements'][3]['options']['questions'][0]['widget']['options']['query'] = ''
    >>> Form.validate_configuration(BROKEN, instrument_definition=INSTRUMENT)
    Traceback (most recent call last):
        ...
    ValidationError: Widget configuration for subfield1 is missing query

    >>> del BROKEN['pages'][0]['elements'][3]['options']['questions'][0]['widget']['options']
    >>> Form.validate_configuration(BROKEN, instrument_definition=INSTRUMENT)
    Traceback (most recent call last):
        ...
    ValidationError: Widget configuration for subfield1 is missing query


PresentationAdaptor & Registry
==============================

When a form with a lookupText widget is processed through the
PresentationAdaptor, the queries for the widgets are removed from the form and
replaced with an identifier that can be used later to execute the query.::

    >>> pprint(FORM['pages'][0]['elements'][1]['options']['widget'])
    {'options': {'query': '/instrument{uid :as value, title :as label}.guard($search, filter(uid~$search|title~$search))'},
     'type': 'lookupText'}

    >>> pprint(FORM['pages'][0]['elements'][3]['options']['questions'][0]['widget'])
    {'options': {'query': '/instrument{uid :as value, upper(title) :as label}.guard($search, filter(uid~$search|title~$search))'},
     'type': 'lookupText'}

    >>> form = lookup.LookupPresentationAdaptor.adapt(INSTRUMENT, FORM)
    >>> pprint(form['pages'][0]['elements'][1]['options']['widget'])
    {'options': {'lookup': '57b865e44225a292e69d6f0815d5c05615a6fd77fbc110acc352d31b61f44d20'},
     'type': 'lookupText'}

    >>> pprint(form['pages'][0]['elements'][3]['options']['questions'][0]['widget'])
    {'options': {'lookup': '90fa016714d9229d01e648d05609785d66e55e7298cb310b81daccf9f9a442cd'},
     'type': 'lookupText'}

    >>> lookup_id = form['pages'][0]['elements'][1]['options']['widget']['options']['lookup']
    >>> lookup.REGISTRY.get_query(lookup_id)
    '/instrument{uid :as value, title :as label}.guard($search, filter(uid~$search|title~$search))'

    >>> lookup.REGISTRY.get_query(form['pages'][0]['elements'][3]['options']['questions'][0]['widget']['options']['lookup'])
    '/instrument{uid :as value, upper(title) :as label}.guard($search, filter(uid~$search|title~$search))'


Web API
=======

This package exposes a simple JSON API for invoking the lookup queries::

    >>> rex = Rex('rex.forms_demo')
    >>> rex.on()

    >>> req = Request.blank('/lookup?lookup=%s' % (lookup_id,), remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 325
    Set-Cookie: ...
    <BLANKLINE>
    {"values":[{"value":"calculation","label":"Calculation Instrument"},{"value":"calculation-complex","label":"Calculation Instrument"},{"value":"complex","label":"Complex Instrument"},{"value":"disabled","label":"Disabled Instrument"},{"value":"simple","label":"Simple Instrument"},{"value":"texter","label":"SMS Instrument"}]}

    >>> req = Request.blank('/lookup?lookup=%s&query=calc' % (lookup_id,), remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: 134
    Set-Cookie: ...
    <BLANKLINE>
    {"values":[{"value":"calculation","label":"Calculation Instrument"},{"value":"calculation-complex","label":"Calculation Instrument"}]}

    >>> req = Request.blank('/lookup?lookup=doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    Content-Length: 83
    Content-Type: text/plain; charset=UTF-8
    <BLANKLINE>
    404 Not Found
    <BLANKLINE>
    The resource could not be found.
    <BLANKLINE>
     Unknown lookup ID "doesntexist"  



    >>> rex.off()


