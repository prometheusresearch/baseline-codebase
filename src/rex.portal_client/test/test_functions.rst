************************
  rex.portal_client
************************

.. contents:: Table of Contents

Normal action
==============

::

  >>> from rex.core import Rex
  >>> from rex.portal_client import Shard
  >>> from requests_mock import Mocker, ANY
  >>> demo = Rex('rex.portal_client_demo')
  >>> demo.on()
  >>> shard = Shard(id='x', title='X', url='http://example.com', api_key='x')

Get subjects::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={'subjects': [], 'count': 0})
  ...     shard.get_subjects() # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  []

Get consents::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={'consents': [], 'count': 0})
  ...     shard.get_consents() # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  []

Get tasks (alongside with pagination)::

  >>> with Mocker() as m:
  ...     tasks = [{} for i in range(51)]
  ...     def return_tasks(request, context):
  ...         offset = int(request.qs['offset'][0])
  ...         limit = int(request.qs['limit'][0])
  ...         ret = tasks[offset:offset + limit]
  ...         return {'tasks': ret, 'count': len(ret)}
  ...     _ = m.register_uri(ANY, ANY, json=return_tasks)
  ...     received = shard.get_tasks()
  ...     len(received) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  51

Get users for subject::
  
  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={'users': [], 'count': 0})
  ...     shard.get_subject_users('1') # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  []

Update subject::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={})
  ...     shard.update_subject('1', {'some': 'data'}) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  {}

Update consent::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={})
  ...     shard.update_consent('1', {'some': 'data'}) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  {}

Delete consent::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={})
  ...     shard.delete_consent('1') # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  {}

Update task::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={})
  ...     shard.update_task('1', {'some': 'data'}) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  {}

Delete task::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={})
  ...     shard.delete_task('1') # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  {}

Submit tasks::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={})
  ...     shard.submit_tasks([{'some': 'data'}]) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE

Publish enrollment profile::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, json={})
  ...     shard.publish_enrollment_profile('enrollhere',
  ...            'requirement-list-id',
  ...            tasks=[{'some': 'data'}],
  ...            consents=[{'some': 'data'}]) # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  {}


Handle 2xx HTTP statuses
========================

HTTP 200, 201, 202 all return json::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, status_code=200, json={'subjects': [], 'count': 0})
  ...     shard.get_subjects() # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  []

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, status_code=201, json={'subjects': [], 'count': 0})
  ...     shard.get_subjects() # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  []

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, status_code=202, json={'subjects': [], 'count': 0})
  ...     shard.get_subjects() # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  []

HTTP 204 returns nothing::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, status_code=204, json={'subjects': [], 'count': 0})
  ...     shard.delete_task('1') # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE


Handle Errors
=============

HTTP 400 errors always get the json error::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, status_code=400, json={'error': 'No such task'})
  ...     shard.delete_task('1') # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  PatientPortalClientError: ERROR/Portal: No such task


All other errors could be anything so we consider the text::

  >>> with Mocker() as m:
  ...     _ = m.register_uri(ANY, ANY, status_code=500, text="Internal Server Error")
  ...     shard.delete_task('1') # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
  Traceback (most recent call last):
  ...
  PatientPortalClientError: ERROR/Portal: Internal Server Error
