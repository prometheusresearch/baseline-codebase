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

We enable the audit trigger to verify how it handles updates for various
data types::

    >>> driver = cluster.drive()
    >>> driver("""include: rex.deploy:/deploy/audit.yaml""")
    >>> driver.commit()
    >>> driver.close()

Now we can make some queries to see how ``rex.deploy`` metadata changes HTSQL
labels and headers::

    >>> from rex.db import Query

    >>> q = Query('''
    ...     /family{id(), code, notes, /individual{id()}}
    ... ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +ELLIPSIS
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
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +ELLIPSIS
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
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
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
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
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
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | Assessment                                                                           |
     +---------+------+-----+--------+--------+-------+-------+-----------+---------+-------+
     | Subject | Code | Age | Height | Salary | Birth | Sleep | Timestamp | Current | Other |
    -+---------+------+-----+--------+--------+-------+-------+-----------+---------+-------+-

    >>> q = Query(''' /sample.individual ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | Subject |
    -+---------+-


JSON support
============

``rex.deploy`` provides support for the JSON data type.  We can add JSON values
to the database::

    >>> q = Query('''
    ...     do(
    ...         $family_id := insert(family:={code:='1000'}),
    ...         $individual_id := insert(individual:={family:=$family_id, code:='01'}),
    ...         $sample_id := insert(
    ...             sample:={
    ...                 individual:=$individual_id,
    ...                 code:='S',
    ...                 other:='{"type": "speed", "value": 5, "errors": [-0.3, 0.12], "notes": null, "set": false}'}),
    ...         sample[$sample_id]{id(), other}) ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | Assessment                     |
     +-----------+--------------------+
     | id()      | Other              |
    -+-----------+--------------------+-
     | 1000.01.S | {                  |
     :           :   "errors": [      :
     :           :     -0.3,          :
     :           :     0.12           :
     :           :   ],               :
     :           :   "notes": null,   :
     :           :   "set": false,    :
     :           :   "type": "speed", :
     :           :   "value": 5       :
     :           : }                  :

JSON values can also be constructed from HTSQL records::

    >>> q = Query('''
    ...     do(
    ...         $sample_id := insert(
    ...             sample:={
    ...                 individual:=[1000.01],
    ...                 code:='W',
    ...                 other:=json({
    ...                     type:='weight',
    ...                     value:=17,
    ...                     notes:=null,
    ...                     unset:=true,
    ...                     errors:=json({
    ...                         min:=-0.2,
    ...                         max:=0.03})})}),
    ...         sample[$sample_id]{id(), other}) ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | Assessment                      |
     +-----------+---------------------+
     | id()      | Other               |
    -+-----------+---------------------+-
     | 1000.01.W | {                   |
     :           :   "errors": {       :
     :           :     "max": 0.03,    :
     :           :     "min": -0.2     :
     :           :   },                :
     :           :   "notes": null,    :
     :           :   "type": "weight", :
     :           :   "unset": true,    :
     :           :   "value": 17       :
     :           : }                   :

In JSON format, JSON data is serialized as a native JSON object::

    >>> q = Query(''' /sample{id(), other} ''')
    >>> print(q.format('json').decode('utf-8'))         # doctest: +NORMALIZE_WHITESPACE
    {
      "sample": [
        {
          "0": "1000.01.S",
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
        },
        {
          "0": "1000.01.W",
          "other": {
            "errors": {
              "max": 0.03,
              "min": -0.2
            },
            "notes": null,
            "type": "weight",
            "unset": true,
            "value": 17
          }
        }
      ]
    }

You can convert JSON values to text and vice versa.  You can also use
untyped JSON literals::

    >>> q = Query(''' {json('{}'), text(json('{}')), json(text(json('{}')))} ''')
    >>> print(q.format('json').decode('utf-8'))         # doctest: +NORMALIZE_WHITESPACE
    {
      "0": {},
      "1": "{}",
      "2": {}
    }

HTSQL records are converted to JSON objects::

    >>> q = Query('''
    ...     {json({
    ...         type := 'individual_num',
    ...         value := count(individual),
    ...         notes := '"autogenerated"' })} ''')
    >>> print(q.format('json').decode('utf-8'))         # doctest: +NORMALIZE_WHITESPACE
    {
      "0": {
        "notes": "\"autogenerated\"",
        "type": "individual_num",
        "value": 1
      }
    }

JSON objects can be passed to queries as parameters::

    >>> q = Query('''
    ...     do(
    ...         $sample_id := insert(
    ...             sample:={
    ...                 individual:='1000.01',
    ...                 code:='T',
    ...                 other:=$other}),
    ...         sample[$sample_id]{id(), other}) ''')
    >>> print(q.format('txt',
    ...     other={
    ...         "type": "speed",
    ...         "value": 5,
    ...         "errors": [-0.3, 0.12],
    ...         "notes": None,
    ...         "set": False}).decode('utf-8'))         # doctest: +NORMALIZE_WHITESPACE
     | Assessment                     |
     +-----------+--------------------+
     | id()      | Other              |
    -+-----------+--------------------+-
     | 1000.01.T | {                  |
     :           :   "errors": [      :
     :           :     -0.3,          :
     :           :     0.12           :
     :           :   ],               :
     :           :   "notes": null,   :
     :           :   "set": false,    :
     :           :   "type": "speed", :
     :           :   "value": 5       :
     :           : }                  :

You can extract values from a JSON object using ``json_get()`` and
``json_get_json()`` functions::

    >>> q = Query('''
    ...     json('{"result": {"victory": true}}')
    ...     :json_get_json('result')
    ...     :json_get('victory')
    ...     :boolean
    ... ''')
    >>> print(q.format('json').decode('utf-8'))         # doctest: +NORMALIZE_WHITESPACE
    {
      "0": true
    }

You can also use JSON arrays and objects with ``for()`` and ``with()``
commands::

    >>> q = Query('''
    ...     with($input,
    ...         for($family_data := $families,
    ...             with($family_data,
    ...                 do(
    ...                     $family := insert(family:={code:=$code}),
    ...                     for($individual_data := $individuals,
    ...                         with($individual_data,
    ...                             insert(individual:={family:=$family, code:=$code, sex:=$sex}))),
    ...                     family[$family]{code, /individual})))) ''')
    >>> print(q.format('txt',
    ...     input={ "families": [
    ...         { "code": "2000", "individuals": [{"code":"01", "sex":"male"}, {"code":"02", "sex":"female"}] },
    ...         { "code": "2001", "individuals": [{"code":"01", "sex":"male"}] },
    ...         { "code": "2002", "individuals": [] }]}).decode('utf-8'))   # doctest: +NORMALIZE_WHITESPACE
     | Family                                                            |
     +------+------------------------------------------------------------+
     |      | Subject                                                    |
     |      +--------+------------+--------+--------------+--------------+
     | Code | Family | Subject ID | Sex    | Birth Mother | Birth Father |
    -+------+--------+------------+--------+--------------+--------------+-
     | 2000 | 2000   | 01         | male   |              |              |
     :      | 2000   | 02         | female |              |              |
     | 2001 | 2001   | 01         | male   |              |              |
     | 2002 |        :            :        :              :              :

You can access JSON data through ports::

    >>> from rex.port import Port

    >>> json_port = Port('''
    ... entity: sample
    ... select: [individual, code, other]
    ... ''')

    >>> sample = json_port.produce(('sample', '1000.01.S')).data.sample[0]

    >>> import json
    >>> print(json.dumps(sample.other, sort_keys=True))
    {"errors": [-0.3, 0.12], "notes": null, "set": false, "type": "speed", "value": 5}

You can also use port interface to add and modify JSON data::

    >>> updated_sample = json_port.replace(
    ...     { 'sample': sample },
    ...     { 'sample': { 'id': sample.id, 'other': {"type": "acceleration", "value": -3.5} } }).data.sample[0]

    >>> print(json.dumps(updated_sample.other, sort_keys=True))
    {"type": "acceleration", "value": -3.5}

``NULL`` values could also be stored::

    >>> removed_sample = json_port.replace(
    ...     { 'sample': updated_sample },
    ...     { 'sample': { 'id': updated_sample.id, 'other': None } }).data.sample[0]

    >>> print(removed_sample.other)
    None


Text functions
==============

``rex.deploy`` wraps a number of SQL functions and operators.

To search for a text field with a regular expression, use function
``re_matches``::

    >>> q = Query(''' {re_matches('42', '\\d+'), re_matches('ten', '\\d+')} ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | re_matches('42','\d+') | re_matches('ten','\d+') |
    -+------------------------+-------------------------+-
     | true                   | false                   |

``rex.deploy`` also provides interface for full-text search::

    >>> q = Query(''' {ft_matches('queries', 'query'), ft_matches('requests', 'query')} ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | ft_matches('queries','query') | ft_matches('requests','query') |
    -+-------------------------------+--------------------------------+-
     | true                          | false                          |

Functions ``ft_headline`` and ``ft_rank`` return text extracts and search rank
respectively::

    >>> q = Query(''' {ft_headline('queries', 'query'), ft_rank('queries', 'query')} ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | ft_headline('queries','query') | ft_rank('queries','query') |
    -+--------------------------------+----------------------------+-
     | <b>queries</b>                 |                  0.0607927 |

Use functions ``ft_query_matches``, ``ft_query_headline``, ``ft_query_rank``
if you want to use query syntax for searching::

    >>> q = Query(''' {ft_query_matches('queries', 'q:*'),
    ...                ft_query_headline('queries', 'q:*'),
    ...                ft_query_rank('queries', 'q:*')} ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | ft_query_matches('queries','q:*') | ft_query_headline('queries','q:*') | ft_query_rank('queries','q:*') |
    -+-----------------------------------+------------------------------------+--------------------------------+-
     | true                              | <b>queries</b>                     |                      0.0607927 |

Use function ``join()`` to concatenate a set of strings::

    >>> q = Query(''' join(family.code, ', ') ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | join(family.code,', ') |
    -+------------------------+-
     | 1000, 2000, 2001, 2002 |

As with other aggregate functions, the first argument could be wrapped
in a selector::

    >>> q = Query(''' join(family{code}, ', ') ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | join(family{code},', ') |
    -+-------------------------+-
     | 1000, 2000, 2001, 2002  |

The selector must contain one element::

    >>> q = Query('''join(family{code, notes}, ', ')''')
    >>> print(q.format('txt').decode('utf-8'))
    Traceback (most recent call last):
      ...
    htsql.core.error.Error: Function 'join' expects 1 field for its first argument; got 2
    While translating:
        join(family{code, notes}, ', ')
                   ^^^^^^^^^^^^^


Math functions
==============

Some math functions provided by PostgreSQL are exposed to HTSQL.  They include
``abs()``, ``sign()``, ``ceil()``, ``floor()``, ``div()``, ``mod()``,
``exp()``, ``pow()``, ``ln()``, ``log10()``, ``log()``::

    >>> q = Query(''' {abs(-5), sign(-5), ceil(3.5), floor(3.5), div(5,2), mod(5,2),
    ...                exp(0), pow(2,4), ln(1), log10(100), log(27,3)} ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | abs(-5) | sign(-5) | ceil(3.5) | floor(3.5) | div(5,2) | mod(5,2) | exp(0) | pow(2,4) | ln(1) | log10(100) | log(27,3) |
    -+---------+----------+-----------+------------+----------+----------+--------+----------+-------+------------+-----------+-
     |       5 |       -1 |         4 |          3 |        2 |        1 |      1 |       16 |     0 |          2 |         3 |

Regular trigonometric functions are also available::

    >>> q = Query(''' {pi(), acos(1), asin(0), atan(0), atan2(0,1),
    ...                cos(pi()), cot(0.5*pi()), sin(0), tan(0)} ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | pi()          | acos(1) | asin(0) | atan(0) | atan2(0,1) | cos(pi()) | cot(0.5*pi())     | sin(0) | tan(0) |
    -+---------------+---------+---------+---------+------------+-----------+-------------------+--------+--------+-
     | 3.14159265359 |     0.0 |     0.0 |     0.0 |        0.0 |      -1.0 | 6.12323399574e-17 |    0.0 |    0.0 |

Function ``random()`` generates a random value::

    >>> q = Query(''' random() ''')
    >>> r = q.produce().data
    >>> 0 <= r <= 1
    True

Function ``width_bucket()`` returns the bucket in a histogram to which the
operand would be assigned.

    >>> q = Query(''' width_bucket(6, 4, 8, 16) ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | width_bucket(6,4,8,16) |
    -+------------------------+-
     |                      9 |

    >>> q = Query(''' width_bucket(6e1, 40, 80, 160) ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +NORMALIZE_WHITESPACE
     | width_bucket(6e1,40,80,160) |
    -+-----------------------------+-
     |                          81 |


Identity Conversion
===================

``rex.deploy`` provides identity to text conversion, which could be used to
find records by incomplete identifier::

    >>> q = Query(''' /sample{id(), age, height, salary, birth, sleep}?text(id())~'.T' ''')
    >>> print(q.format('txt').decode('utf-8'))          # doctest: +ELLIPSIS, +NORMALIZE_WHITESPACE
     | Assessment                                                |
     +-----------+-----+--------+--------+------------+----------+
     | id()      | Age | Height | Salary | Birth      | Sleep    |
    -+-----------+-----+--------+--------+------------+----------+-
     | 1000.01.T |   0 |    0.0 |      0 | .........  | 00:00:00 |

``rex.deploy`` correctly wraps nested identifier with parentheses::

    >>> q = Query(''' text(id(1001, id(id('demographics-form'), 1), 1)) ''')
    >>> print(q.produce())
    '1001.(demographics-form.1).1'

It also correctly escapes text components::

    >>> q = Query(''' text(id('Patrick O''Brian')) ''')
    >>> print(q.produce())
    '''Patrick O''''Brian'''

Null components are converted to null strings::

    >>> q = Query(''' text(id(null, 1)) ''')
    >>> print(q.produce())
    null

Finally we delete the test database::

    >>> demo.off()
    >>> cluster.drop()



