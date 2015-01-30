*****************
  Querying data
*****************

.. contents:: Table of Contents


HTSQL labels and headers
========================

We start with creating a database schema::

    >>> from rex.deploy import Cluster
    >>> cluster = Cluster('pgsql:deploy_demo_htsql')
    >>> cluster.overwrite()
    >>> driver = cluster.drive()

    >>> driver("""
    ... - { table: family }
    ... - { column: family.code, type: text }
    ... - { identity: [family.code] }
    ... - { column: family.notes, type: text, required: false }
    ... - { table: individual, title: Subject }
    ... - { link: individual.family }
    ... - { column: individual.code, type: text, title: Subject ID }
    ... - { identity: [individual.family, individual.code] }
    ... - { column: individual.sex, type: [male, female], required: false }
    ... - { link: individual.mother, to: individual, required: false, title: Birth Mother }
    ... - { link: individual.father, to: individual, required: false, title: Birth Father }
    ... - { table: individual_id }
    ... - { link: individual_id.individual }
    ... - { identity: [individual_id.individual ] }
    ... - { column: individual_id.unique_id, type: text }
    ... - { column: individual_id.first_name, type: text, required: false }
    ... - { column: individual_id.last_name, type: text, required: false }
    ... - { table: sample, title: Assessment }
    ... - { link: sample.individual }
    ... - { column: sample.code, type: text }
    ... - { identity: [sample.individual, sample.code] }
    ... - { column: sample.age, type: integer, default: 0 }
    ... - { column: sample.height, type: float, default: 0.0 }
    ... - { column: sample.salary, type: decimal, default: 0.0 }
    ... - { column: sample.birth, type: date, default: today() }
    ... - { column: sample.sleep, type: time, default: '00:00' }
    ... - { column: sample.timestamp, type: datetime, default: now() }
    ... - { column: sample.current, type: boolean, default: false }
    ... - { column: sample.other, type: json, default: {}, required: false }
    ... """)
    >>> driver.commit()
    >>> driver.close()

Now we make a Rex application over the created database::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.db', 'rex.deploy', 'rex.port',
    ...            db='pgsql:deploy_demo_htsql',
    ...            htsql_extensions={'rex_deploy': {}})
    >>> demo.on()

Now we can make some queries to see how ``rex.deploy`` metadata changes HTSQL
labels and headers::

    >>> from rex.db import Query

    >>> q = Query('''
    ...     /family{id(), code, notes, /individual{id()}}
    ... ''')
    >>> print q.format('txt')                           # doctest: +ELLIPSIS
     | Family                        |
     +------+------+-------+---------+
     |      |      |       | Subject |
     |      |      |       +---------+
     | id() | Code | Notes | id()    |
    -+------+------+-------+---------+-
    ...

    >>> q = Query('''
    ...     /individual{id(), family{id()}, code, sex, mother{id()}, father{id()},
    ...                 individual_id{unique_id},
    ...                 /individual_via_mother{id()}, /individual_via_father{id()},
    ...                 /sample{id()}}
    ... ''')
    >>> print q.format('txt')                           # doctest: +ELLIPSIS
     | Subject                                                                                                         |
     +------+--------+------------+-----+--------------+--------------+---------------+---------+---------+------------+
     |      | Family |            |     | Birth Mother | Birth Father | Individual Id | Subject | Subject | Assessment |
     |      +--------+            |     +--------------+--------------+---------------+---------+---------+------------+
     | id() | id()   | Subject ID | Sex | id()         | id()         | Unique Id     | id()    | id()    | id()       |
    -+------+--------+------------+-----+--------------+--------------+---------------+---------+---------+------------+-
    ...

    >>> q = Query('''
    ...     /individual_id{individual{id()}, unique_id, first_name, last_name}
    ... ''')
    >>> print q.format('txt')                           # doctest: +NORMALIZE_WHITESPACE
     | Individual Id                                |
     +---------+-----------+------------+-----------+
     | Subject |           |            |           |
     +---------+           |            |           |
     | id()    | Unique Id | First Name | Last Name |
    -+---------+-----------+------------+-----------+-

    >>> q = Query('''
    ...     /sample{id(), individual{id()},
    ...             age, height, salary, birth, sleep, timestamp, current, other}
    ... ''')
    >>> print q.format('txt')                           # doctest: +NORMALIZE_WHITESPACE
     | Assessment                                                                           |
     +------+---------+-----+--------+--------+-------+-------+-----------+---------+-------+
     |      | Subject |     |        |        |       |       |           |         |       |
     |      +---------+     |        |        |       |       |           |         |       |
     | id() | id()    | Age | Height | Salary | Birth | Sleep | Timestamp | Current | Other |
    -+------+---------+-----+--------+--------+-------+-------+-----------+---------+-------+-


Links in HTSQL selector
=======================

The default selector may now include links::

    >>> q = Query(''' /individual.sample ''')
    >>> print q.format('txt')                           # doctest: +NORMALIZE_WHITESPACE
     | Assessment                                                                           |
     +---------+------+-----+--------+--------+-------+-------+-----------+---------+-------+
     | Subject | Code | Age | Height | Salary | Birth | Sleep | Timestamp | Current | Other |
    -+---------+------+-----+--------+--------+-------+-------+-----------+---------+-------+-

    >>> q = Query(''' /sample.individual ''')
    >>> print q.format('txt')                           # doctest: +NORMALIZE_WHITESPACE
     | Subject |
    -+---------+-


JSON support
============

``rex.deploy`` provides support for the JSON data type.  We can add JSON values
to the database::

    >>> q = Query('''
    ...     do(
    ...         $family_id := insert(family:={code:='01'}),
    ...         $individual_id := insert(individual:={family:=$family_id, code:='1000'}),
    ...         $sample_id := insert(
    ...             sample:={
    ...                 individual:=$individual_id,
    ...                 code:='S',
    ...                 other:='{"type": "speed", "value": 5, "errors": [-0.3, 0.12], "notes": null, "set": false}'}),
    ...         sample[$sample_id]{id(), other}) ''')
    >>> print q.format('txt')                                           # doctest: +NORMALIZE_WHITESPACE
     | Assessment                     |
     +-----------+--------------------+
     | id()      | Other              |
    -+-----------+--------------------+-
     | 01.1000.S | {                  |
     :           :   "errors": [      :
     :           :     -0.3,          :
     :           :     0.12           :
     :           :   ],               :
     :           :   "notes": null,   :
     :           :   "set": false,    :
     :           :   "type": "speed", :
     :           :   "value": 5       :
     :           : }                  :

In JSON format, JSON data is serialized as a native JSON object::

    >>> q = Query(''' /sample{id(), other} ''')
    >>> print q.format('json')                                          # doctest: +NORMALIZE_WHITESPACE
    {
      "sample": [
        {
          "0": "01.1000.S",
          "other": {
            "errors": [
              -0.3,
              0.12
            ],
            "notes": null,
            "set": false,
            "type": "speed",
            "value": 5
          }
        }
      ]
    }

You can convert JSON values to text and vice versa.  You can also use
untyped JSON literals::

    >>> q = Query(''' {json('{}'), text(json('{}')), json(text(json('{}')))} ''')
    >>> print q.format('json')                                          # doctest: +NORMALIZE_WHITESPACE
    {
      "0": {},
      "1": "{}",
      "2": {}
    }

You can access JSON data through ports::

    >>> from rex.port import Port

    >>> json_port = Port('''
    ... entity: sample
    ... select: [individual, code, other]
    ... ''')

    >>> sample = json_port.produce(('sample', '01.1000.S')).data.sample[0]

    >>> import json
    >>> print json.dumps(sample.other, sort_keys=True)
    {"errors": [-0.3, 0.12], "notes": null, "set": false, "type": "speed", "value": 5}

You can also use port interface to add and modify JSON data::

    >>> updated_sample = json_port.replace(
    ...     { 'sample': sample },
    ...     { 'sample': { 'id': sample.id, 'other': {"type": "acceleration", "value": -3.5} } }).data.sample[0]

    >>> print json.dumps(updated_sample.other, sort_keys=True)
    {"type": "acceleration", "value": -3.5}

``NULL`` values could also be stored::

    >>> removed_sample = json_port.replace(
    ...     { 'sample': updated_sample },
    ...     { 'sample': { 'id': updated_sample.id, 'other': None } }).data.sample[0]

    >>> print removed_sample.other
    None


Text functions
==============

``rex.deploy`` wraps a number of SQL functions and operators.

To search for a text field with a regular expression, use function
``re_matches``::

    >>> q = Query(''' {re_matches('42', '\\d+'), re_matches('ten', '\\d+')} ''')
    >>> print q.format('txt')                                       # doctest: +NORMALIZE_WHITESPACE
     | re_matches('42','\d+') | re_matches('ten','\d+') |
    -+------------------------+-------------------------+-
     | true                   | false                   |

``rex.deploy`` also provides interface for full-text search::

    >>> q = Query(''' {ft_matches('queries', 'query'), ft_matches('requests', 'query')} ''')
    >>> print q.format('txt')                                       # doctest: +NORMALIZE_WHITESPACE
     | ft_matches('queries','query') | ft_matches('requests','query') |
    -+-------------------------------+--------------------------------+-
     | true                          | false                          |

Functions ``ft_headline`` and ``ft_rank`` return text extracts and search rank
respectively::

    >>> q = Query(''' {ft_headline('queries', 'query'), ft_rank('queries', 'query')} ''')
    >>> print q.format('txt')                                       # doctest: +NORMALIZE_WHITESPACE
     | ft_headline('queries','query') | ft_rank('queries','query') |
    -+--------------------------------+----------------------------+-
     | <b>queries</b>                 |                  0.0607927 |

Use functions ``ft_query_matches``, ``ft_query_headline``, ``ft_query_rank``
if you want to use query syntax for searching::

    >>> q = Query(''' {ft_query_matches('queries', 'q:*'),
    ...                ft_query_headline('queries', 'q:*'),
    ...                ft_query_rank('queries', 'q:*')} ''')
    >>> print q.format('txt')                                       # doctest: +NORMALIZE_WHITESPACE
     | ft_query_matches('queries','q:*') | ft_query_headline('queries','q:*') | ft_query_rank('queries','q:*') |
    -+-----------------------------------+------------------------------------+--------------------------------+-
     | true                              | <b>queries</b>                     |                      0.0607927 |

Use function ``join()`` to concatenate a set of strings::

    >>> q = Query(''' join(family.code, ', ') ''')
    >>> print q.format('txt')                                       # doctest: +NORMALIZE_WHITESPACE
     | join(family.code,', ') |
    -+------------------------+-
     | 01                     |

As with other aggregate functions, the first argument could be wrapped
in a selector::

    >>> q = Query(''' join(family{code}, ', ') ''')
    >>> print q.format('txt')                                       # doctest: +NORMALIZE_WHITESPACE
     | join(family{code},', ') |
    -+-------------------------+-
     | 01                      |

The selector must contain one element::

    >>> q = Query(''' join(family{code, notes}, ', ') ''')
    >>> print q.format('txt')
    Traceback (most recent call last):
      ...
    Error: Function 'join' expects 1 field for its first argument; got 2
    While translating:
         join(family{code, notes}, ', ')
                    ^^^^^^^^^^^^^

Finally we delete the test database::

    >>> demo.off()
    >>> cluster.drop()


