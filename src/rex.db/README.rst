**************************************************
  REX.DB -- Database access for the Rex platform
**************************************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: func(literal)


Overview
========

This package implements database access based on HTSQL_.  It provides:

* access to the HTSQL service;
* support for canned HTSQL queries;
* ability to make HTSQL queries in commands and templates.

This package is a part of the RexDB platform for medical research data
management.  It is created by Prometheus Research, LLC and released under
AGPLv3 license.

.. _HTSQL: http://htsql.org/


Connecting to the database
==========================

Any application that uses :mod:`rex.db` package must specify the configuration
parameter ``db``, the HTSQL connection URI.  The connection URI must have the
form::

    <engine>://<username>:<password>@<host>:<port>/<database>

In our examples, we use a SQLite database ``./sandbox/db_demo.sqlite``, which
is generated from a database schema ``rex.db_demo/static/db_demo.sql``::

    >>> from rex.core import Rex

    >>> demo = Rex('rex.db_demo', db='sqlite:./sandbox/db_demo.sqlite')

To enable and configure HTSQL addons, use settings ``htsql_base_extensions``
and ``htsql_extensions``.

Use ``htsql_base_extensions`` to preset HTSQL configuration for a particular
application.  For example::

    htsql_base_extensions:
        tweak.meta:
        tweak.shell.default:
        tweak.timeout:
            timeout: 30
        tweak.autolimit:
            limit: 10000

Use ``htsql_extensions`` to override the preset configuration for a specific
deployment.  For example::

    htsql_extensions:
        tweak.timeout:
            timeout: 600


HTSQL service
=============

Raw HTSQL service is available under the :mod:`rex.db` mount point.  By
default, the access is restricted to authenticated users::

    >>> from webob import Request

    >>> req = Request.blank('/db/department')
    >>> req.remote_user = 'Alice'
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    ...
     | department                                    |
     +--------+------------------------+-------------+
     | code   | name                   | school_code |
    -+--------+------------------------+-------------+-
     | acc    | Accounting             | bus         |
     | arthis | Art History            | la          |
     | astro  | Astronomy              | ns          |
    ...


Permissions required to access HTSQL service is controlled by configuration
parameter ``htsql_access``.  Set ``htsql_access`` to ``None`` to disable
HTSQL service.


``*.htsql`` files
=================

Often, letting users access the raw HTSQL service is not desirable for security
reasons.  In this case, you can use "canned" or prepared HTSQL queries.

To make a canned query, create a static resource with ``.htsql`` extension and
put it under the ``www`` directory.  For example, :mod:`rex.db_demo` contains a
static resource ``rex.db_demo/static/www/departments_by_school.htsql``::

    # List all departments associated with the given school.
    # If no school is given, list all departments.

    query:
      /department
        .select(code, name)
        .guard($school, filter(school.code=$school))

    parameters:
      school: null

This file is in a YAML_ format.  It contains a record with two fields:

``query``
    The HTSQL query to execute.
``parameters``
    A dictionary that maps expected query parameters to default values.

.. _YAML: http://yaml.org/

Using our example, to get a list of departments in the *School of Natural
Science*, we make a request::

    >>> req = Request.blank('/departments_by_school.htsql?school=ns')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    ...
     | department          |
     +-------+-------------+
     | code  | name        |
    -+-------+-------------+-
     | astro | Astronomy   |
     | chem  | Chemistry   |
     | mth   | Mathematics |
    ...

``*.htsql`` files are subject to normal access rules for static resources, so
with ``*.htsql`` files, you can easily configure your application to permit
selected users run a limited set of queries.


Using HTSQL in templates
========================

You can execute HTSQL queries and process the result in HTML templates.  For
example, :mod:`rex.db_demo` has a template
``rex.db_demo/static/www/list_of_departments.html``::

    <!DOCTYPE html>
    <title>List of Departments</title>
    <body>
      <table>
        <tr><th colspan="3">Departments ({{ htsql("count(department)") }})</th></tr>
        <tr><th>No</th><th>Code</th><th>Name</th></tr>
        {%- for department in htsql("/department{code, name}") %}
        <tr><td>{{ loop.index }}</td><td>{{ department.code|e }}</td><td>{{ department.name|e }}</td></tr>
        {%- endfor %}
      </table>
    </body>

It uses global function ``htsql()`` to make two queries::

    count(department)

    /department{code, name}

The output is a table listing all departments::

    >>> req = Request.blank('/list_of_departments.html')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/html; charset=UTF-8
    ...
    <body>
      <table>
        <tr><th colspan="3">Departments (27)</th></tr>
        <tr><th>No</th><th>Code</th><th>Name</th></tr>
        <tr><td>1</td><td>acc</td><td>Accounting</td></tr>
        <tr><td>2</td><td>arthis</td><td>Art History</td></tr>
        <tr><td>3</td><td>astro</td><td>Astronomy</td></tr>
        ...
      </table>
    </body>


Using HTSQL in commands
=======================

You can perform HTSQL queries in commands and other Python code.
For example, :mod:`rex.db_demo` defines a command ``/department_by_id``,
which finds the department with the given ``id``::

    from rex.core import StrVal
    from rex.web import Command, Parameter
    from rex.db import get_db
    from webob import Response
    from webob.exc import HTTPNotFound

    class DepartmentByIDCommand(Command):

        path = '/department_by_id'
        access = 'anybody'
        parameters = [
                Parameter('id', StrVal(r'\w+')),
        ]

        def render(self, req, id):
            db = get_db()
            department = db.produce("department[$id]", id=id)
            if not department:
                raise HTTPNotFound()
            return Response(json={"code": department.data.code,
                                  "name": department.data.name})

The command uses :func:`rex.db.get_db()` to obtain an HTSQL instance and then
uses the instance to execute a parameterized HTSQL query::

    department[$id]

The produced data is used to generate a response::

    >>> req = Request.blank('/department_by_id?id=comp')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/json; charset=UTF-8
    ...
    {"code":"comp","name":"Computer Science"}


