************************
DraftCalculationSet APIs
************************

.. contents:: Table of Contents


Set up the environment::

    >>> import json
    >>> from copy import deepcopy
    >>> from webob import Request
    >>> from rex.core import Rex
    >>> import rex.formbuilder
    >>> rex = Rex('rex.formbuilder_demo')
    >>> rex.on()
    >>> DEFINITION = {
    ...     'instrument': {
    ...         'id': 'urn:test-instrument',
    ...         'version': '1.1',
    ...     },
    ...     'calculations': [
    ...         {
    ...             'id': 'calc1',
    ...             'type': 'integer',
    ...             'method': 'python',
    ...             'options': {
    ...                 'expression': '2 * 3',
    ...             },
    ...         },
    ...     ],
    ... }


The ``/api/draftcalculationset`` URI will accept GETs for listing::

    >>> req = Request.blank('/api/draftcalculationset', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    [{"definition": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "calculations": [{"method": "python", "type": "text", "options": {"expression": "assessment['q_fake'].upper()"}, "id": "uppercased"}]}, "uid": "draftiv1", "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}}]


The ``/draftcalculationset`` URI will accept POSTs for creating new instances::

    >>> req = Request.blank('/api/draftcalculationset', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'draft_instrument_version': 'draftiv1', 'definition': DEFINITION})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "calculations": [{"id": "calc1", "type": "integer", "method": "python", "options": {"expression": "2 * 3"}}]}, "uid": "fake_draftcalculationset_1", "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}}

    >>> req = Request.blank('/api/draftcalculationset', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'draft_instrument_version': 'draftiv1'})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": null, "uid": "fake_draftcalculationset_1", "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}}


The ``/draftcalculationset`` URI will not accept PUTs or DELETEs::

    >>> req = Request.blank('/api/draftcalculationset', method='PUT', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...

    >>> req = Request.blank('/api/draftcalculationset', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftcalculationset/{uid}`` URI will accept GETs to retrieve an
individual DraftCalculationSet::

    >>> req = Request.blank('/api/draftcalculationset/draftiv1', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "calculations": [{"method": "python", "type": "text", "options": {"expression": "assessment['q_fake'].upper()"}, "id": "uppercased"}]}, "uid": "draftiv1", "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}}

    >>> req = Request.blank('/api/draftcalculationset/doesntexist', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    ...


The ``/draftcalculationset/{uid}`` URI will accept PUTs to update a
DraftCalculationSet::

    >>> req = Request.blank('/api/draftcalculationset/draftiv1', method='PUT', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> new_config = deepcopy(DEFINITION)
    >>> req.body = json.dumps({'definition': new_config})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    ### SAVED DRAFTCALCULATIONSET draftiv1
    202 Accepted
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"definition": {"instrument": {"version": "1.1", "id": "urn:test-instrument"}, "calculations": [{"options": {"expression": "2 * 3"}, "type": "integer", "id": "calc1", "method": "python"}]}, "uid": "draftiv1", "draft_instrument_version": {"parent_instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "modified_by": "someone", "uid": "draftiv1", "date_modified": "2015-01-02T00:00:00.000Z", "created_by": "someone", "instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "date_created": "2015-01-01T00:00:00.000Z"}}


The ``/draftcalculationset/{uid}`` URI will accept DELETEs to delete a
DraftCalculationSet::

    >>> req = Request.blank('/api/draftcalculationset/draftiv1', method='DELETE', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    ### DELETED DRAFTCALCULATIONSET draftiv1
    204 No Content
    Content-Type: application/json; charset=UTF-8
    Content-Length: 0
    ...


The ``/draftcalculationset/{uid}`` URI will not accept POSTs::

    >>> req = Request.blank('/api/draftcalculationset/draftiv1', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    405 Method Not Allowed
    ...


The ``/draftcalculationset/{uid}/publish`` URI will accept POSTs to execute
the publishing process on a DraftCalculationSet::

    >>> req = Request.blank('/api/draftcalculationset/draftiv1/publish', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': 'simple1'})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    201 Created
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"status": "SUCCESS", "calculation_set": {"instrument_version": {"instrument": {"status": "active", "code": "simple", "uid": "simple", "title": "Simple Instrument"}, "published_by": "someone", "version": 1, "uid": "simple1", "date_published": "2015-01-01T00:00:00.000Z"}, "uid": "fake_calculationset_1"}}

    >>> req = Request.blank('/api/draftcalculationset/draftiv1/publish', method='POST', remote_user='user1')
    >>> req.headers['Content-Type'] = 'application/json'
    >>> req.body = json.dumps({'instrument_version': 'doesntexist'})
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "doesntexist is not the UID of a valid InstrumentVersion"}

    >>> req = Request.blank('/api/draftcalculationset/draftiv1/publish', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    400 Bad Request
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "No InstrumentVersion specified to publish against."}

    >>> req = Request.blank('/api/draftcalculationset/doesntexist/publish', method='POST', remote_user='user1')
    >>> print(req.get_response(rex))  # doctest: +ELLIPSIS
    404 Not Found
    Content-Type: application/json; charset=UTF-8
    Content-Length: ...
    <BLANKLINE>
    {"error": "The resource could not be found."}



    >>> rex.off()


