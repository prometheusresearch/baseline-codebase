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
    ... - { column: sample.age, type: integer }
    ... - { column: sample.height, type: float }
    ... - { column: sample.salary, type: decimal }
    ... - { column: sample.birth, type: date }
    ... - { column: sample.sleep, type: time }
    ... - { column: sample.timestamp, type: datetime }
    ... - { column: sample.current, type: boolean }
    ... """)
    >>> driver.commit()
    >>> driver.close()

Now we make a Rex application over the created database::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.db', 'rex.deploy',
    ...            db='pgsql:deploy_demo_htsql',
    ...            htsql_extensions={'rex_deploy': {}},
    ...            htsql_access='anybody')
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
    >>> print q.format('txt')                           # doctest: +ELLIPSIS
     | Individual Id                                |
     +---------+-----------+------------+-----------+
     | Subject |           |            |           |
     +---------+           |            |           |
     | id()    | Unique Id | First Name | Last Name |
    -+---------+-----------+------------+-----------+-
    ...

    >>> q = Query('''
    ...     /sample{id(), individual{id()},
    ...             age, height, salary, birth, sleep, timestamp, current}
    ... ''')
    >>> print q.format('txt')                           # doctest: +ELLIPSIS
     | Assessment                                                                   |
     +------+---------+-----+--------+--------+-------+-------+-----------+---------+
     |      | Subject |     |        |        |       |       |           |         |
     |      +---------+     |        |        |       |       |           |         |
     | id() | id()    | Age | Height | Salary | Birth | Sleep | Timestamp | Current |
    -+------+---------+-----+--------+--------+-------+-------+-----------+---------+-
    ...

Finally we delete the test database::

    >>> demo.off()
    >>> cluster.drop()


