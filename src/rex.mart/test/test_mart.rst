*************
Mart Instance
*************


Set up the environment::

    >>> from rex.mart import Mart, MartCreator, get_management_db
    >>> from datetime import datetime
    >>> from pprint import pprint
    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()

    >>> def get_mart(code):
    ...     data = get_management_db().produce('/rexmart_inventory[$code]', code=code)
    ...     if data:
    ...         return Mart.from_record(data[0])
    ...     return None


The Mart object is an encapsulation of the information about a Mart database::

    >>> mc = MartCreator('test', 'empty')
    >>> mart = mc()
    >>> mart   # doctest: +ELLIPSIS
    Mart(code=..., definition=u'empty', owner=u'test')

    >>> isinstance(mart.code, int)
    True
    >>> mart.definition_id
    u'empty'
    >>> pprint(mart.definition)
    {'assessments': [],
     'base': {'fixed_name': None,
              'name_token': 'empty_',
              'target': None,
              'type': 'fresh'},
     'deploy': None,
     'description': None,
     'id': 'empty',
     'label': 'empty',
     'post_assessment_scripts': [],
     'post_deploy_scripts': []}
    >>> mart.owner
    u'test'
    >>> isinstance(mart.name, basestring)
    True
    >>> isinstance(mart.date_creation_started, datetime)
    True
    >>> isinstance(mart.date_creation_completed, datetime)
    True
    >>> mart.pinned
    False

    >>> mart.pinned = True
    >>> mart.pinned
    True
    >>> mart = get_mart(mart.code)
    >>> mart.pinned
    True
    >>> mart.pinned = True
    >>> mart.pinned
    True
    >>> mart = get_mart(mart.code)
    >>> mart.pinned
    True
    >>> mart.pinned = False
    >>> mart.pinned
    False
    >>> mart = get_mart(mart.code)
    >>> mart.pinned
    False

    >>> mart.pinned = 'yes'
    Traceback (most recent call last):
        ...
    ValueError: The value of pinned must be boolean

    >>> pprint(mart.as_dict())  # doctest: +ELLIPSIS
    {'code': ...,
     'date_creation_completed': ...,
     'date_creation_started': ...,
     'definition': u'empty',
     'name': u'mart_empty_...',
     'owner': u'test',
     'pinned': False}

    >>> mart.purge()
    >>> mart = get_mart(mart.code)
    >>> mart is None
    True


    >>> mart = Mart(999, 'fakedefn', 'test', 'dbname', datetime.now(), datetime.now(), False)
    >>> mart.definition is None
    True



    >>> rex.off()

