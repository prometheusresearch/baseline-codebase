*********
  Paths
*********

.. contents:: Table of Contents


Path maps
=========

``PathMap`` class is used to match a URL path against a collection
of URL patterns.  Use method ``PathMap.add()`` to add an URL pattern::

    >>> from rex.web import PathMap, PathMask

    >>> map = PathMap()
    >>> map.add('/', "Index")
    >>> map.add('/individual', "List of Individuals")
    >>> map.add('/individual/{id}', "Individual")
    >>> map.add('/individual/{id}/edit', "Edit Individual")

It is an error to add the same mask twice::

    >>> map.add('/individual/*', None)
    Traceback (most recent call last):
      ...
    ValueError: multiple targets 'Individual' and None for path mask: /individual/*

Use method ``PathMap.get()`` to match a path against the collection::

    >>> map.get('/')
    'Index'
    >>> map.get('/individual')
    'List of Individuals'
    >>> map.get('/individual/1001')
    'Individual'
    >>> map.get('/individual/1001/edit')
    'Edit Individual'
    >>> map.get('/not-found', default="Not Found")
    'Not Found'

You can also use ``[]`` operation::

    >>> map['/individual/1001']
    'Individual'
    >>> map['/not-found']
    Traceback (most recent call last):
      ...
    ValueError: path does not match any mask: /not-found

Use ``in`` operator to check whether the path matches any mask in the
collection::

    >>> '/individual/1001' in map
    True
    >>> '/not-found' in map
    False

You can also match mask objects against the collection::

    >>> map[PathMask('/individual/$id')]
    'Individual'
    >>> map[PathMask('/*')]
    Traceback (most recent call last):
      ...
    ValueError: path does not match any mask: /*

You can iterate over all masks in the map::

    >>> for mask in map:
    ...     print(mask)
    /
    /individual
    /individual/*
    /individual/*/edit

A path must always start with ``/``::

    >>> map.get('ill-formed')
    Traceback (most recent call last):
      ...
    ValueError: path must start with /: 'ill-formed'

When there is more than one pattern matching a path, the most specific
one is selected::

    >>> choice_map = PathMap()
    >>> choice_map.add('/individual/add', "Add Individual")
    >>> choice_map.add('/individual/*', "Select Individual")
    >>> choice_map.add('/individual/**', "Search Individuals")

    >>> choice_map.get('/individual/add')
    'Add Individual'
    >>> choice_map.get('/individual/1001')
    'Select Individual'
    >>> choice_map.get('/individual/sex/f')
    'Search Individuals'

    >>> choice_map.get('/individual', "Not Found")
    'Not Found'


Path masks
==========

A mask object allows you to extract label values from a path::

    >>> mask = PathMask('/individual/{id}')
    >>> mask
    PathMask('/individual/{id}')

    >>> mask('/individual/1001')
    {'id': '1001'}

You can also use ``$`` sign to indicate a label::

    >>> mask = PathMask('/individual/$id')
    >>> mask('/individual/1001')
    {'id': '1001'}

Use ``:`` to add a label to a pattern which is not ``**``::

    >>> mask = PathMask('/individual/{filter:**}')
    >>> mask('/individual/sex/f')
    {'filter': 'sex/f'}

A path that does not match the mask is rejected::

    >>> mask = PathMask('/individual/{id}')

    >>> mask('/individual')
    Traceback (most recent call last):
      ...
    ValueError: path does not match the mask: '/individual'

    >>> mask('/study/1001')
    Traceback (most recent call last):
      ...
    ValueError: path does not match the mask: '/study/1001'

    >>> mask('/individual/1001/edit')
    Traceback (most recent call last):
      ...
    ValueError: path does not match the mask: '/individual/1001/edit'

Paths and masks must start with ``/``::

    >>> mask('ill-formed')
    Traceback (most recent call last):
      ...
    ValueError: path must start with /: 'ill-formed'

    >>> PathMask('ill-formed')
    Traceback (most recent call last):
      ...
    ValueError: path mask must start with /: 'ill-formed'

Symbol ``**`` can only be used once in a mask::

    >>> PathMask('/**/**')
    Traceback (most recent call last):
      ...
    ValueError: symbol ** can only be used once: '/**/**'

Ill-formed labels are rejected::

    >>> PathMask('/individual/{id')
    Traceback (most recent call last):
      ...
    ValueError: invalid label: '{id'



