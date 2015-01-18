****************************
  REX.DB Programming Guide
****************************

.. contents:: Table of Contents
.. role:: mod(literal)
.. role:: class(literal)
.. role:: meth(literal)
.. role:: func(literal)


Overview
========

This package implements database access based on HTSQL_.  It provides:

* access to the HTSQL service;
* support for canned HTSQL queries;
* ability to make HTSQL queries in commands and templates.

This package is a part of the RexDB |R| platform for medical research data
management.  RexDB is free software created by Prometheus Research, LLC and is
released under the AGPLv3 license with a commensurate attribution clause.  For
more information, please visit http://rexdb.org/.

The development of this product was supported by the National Institute of
Mental Health of the National Institutes of Health under Award Number
R43MH099826.

.. _HTSQL: http://htsql.org/
.. |R| unicode:: 0xAE .. registered trademark sign


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

To enable and configure HTSQL addons, use setting ``htsql_extensions``.

You can use ``htsql_extensions`` to preset HTSQL configuration for a particular
application.  For example, you can add to ``settings.yaml``::

    htsql_extensions:
        tweak.meta:
        tweak.shell.default:
        tweak.timeout:
            timeout: 30
        tweak.autolimit:
            limit: 10000

You can also use ``htsql_extensions`` to override the preset configuration for
a specific deployment.  For example, you can add to ``rex.yaml``::

    parameters:
        htsql_extensions:
            tweak.timeout:
                timeout: 600

You can use :func:`rex.db.get_db()` to get an HTSQL instance associated with
the application database::

    >>> from rex.db import get_db

    >>> with demo:
    ...     db = get_db()

    >>> print db.produce("count(department)")
    27

.. highlight:: console

To inspect to the database from the command line, start an HTSQL shell
with command ``rex shell``::

    $ rex shell rex.db_demo --set db=sqlite:./sandbox/db_demo.sqlite
    db_demo$ /count(department)
     | count(department) |
    -+-------------------+-
     |                27 |

You can also execute a batch query command using command ``rex query``::

    $ echo 'count(department)' >count.htsql

    $ rex query rex.db_demo --set db=sqlite:./sandbox/db_demo.sqlite \
                            -i count.htsql \
                            -f csv
    count(department)
    27

Another way to inspect the database schema is to generate a schema diagram
using ``rex graphdb``::

    $ rex graphdb rex.db_demo --set db=sqlite:./sandbox/db_demo.sqlite \
                              -o db_demo.png

``rex graphdb`` uses GraphViz_ utility to render the diagram.

.. _GraphViz: http://www.graphviz.org/


Gateway databases
=================

Aside from the main application database, you can also declare auxiliary
databases called *gateways*.  Each gateway database must have a unique name.
Use setting ``gateways`` to specify HTSQL configuration for each gateway.
For example::

    gateways:

        input:
            tweak.filedb:
                sources:
                - file: ./csv/*.csv

        target: mssql://10.0.0.2/target

Here, we declare two gateway databases: ``input`` and ``target``.  The former
is a SQLite database, which content is loaded from a set of CSV files.  The
latter is a MS SQL database.

You can configure gateways both in a package's configuration file
``settings.yaml`` and in deployment-specific configuration file ``rex.yaml``.
When the same gateway is configured in multiple files, all configuration
parameters are merged.  It is recommended to specify permanent gateway
configuration in ``settings.yaml`` and connection parameters in ``rex.yaml``.

Each gateway database provides an HTSQL gateway function connecting it to the
main application database.  Alternatively, you can pass the gateway name as a
parameter to :func:`rex.db.get_db()` to get an HTSQL instance associated with
the gateway database.


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

:mod:`rex.db` allows you to tunnel HTSQL queries in a POST body.  This is
especially useful for long queries that exceed the request length limit of the
server or the browser::

    >>> req = Request.blank('/db/', POST="/school%7Bname%7D?campus=%27old%27")
    >>> req.remote_user = 'Alice'
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/plain; charset=UTF-8
    ...
     | school                        |
     +-------------------------------+
     | name                          |
    -+-------------------------------+-
     | School of Art & Design        |
     | College of Education          |
     | School of Arts and Humanities |
    ...

HTSQL service requires the ``rex.db`` package permissions, which could be
configured using the ``access`` setting.  To disable HTSQL service, set
``access`` to ``{'rex.db': 'nobody'}``.

HTSQL service for gateway databases is available under URL ``/@<name>/``, where
``<name>`` is the name of the gateway.


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


Function ``htsql()`` can also execute a canned query from a ``.htsql`` file.
For example, page ``rex.db_demo/static/www/school_of_engineering.html`` uses
canned query ``rex.db_demo/static/www/departments_by_school.htsql`` to generate
a list of departments that belong to the school::

    <!DOCTYPE html>
    <title>Departments in the School of Engineering</title>
    <body>
      <table>
        <tr><th colspan="3">Departments in the School of Engineering</th></tr>
        <tr><th>No</th><th>Code</th><th>Name</th></tr>
        {%- for department in htsql("rex.db_demo:/www/departments_by_school.htsql", school='eng') %}
        <tr><td>{{ loop.index }}</td><td>{{ department.code|e }}</td><td>{{ department.name|e }}</td></tr>
        {%- endfor %}
      </table>
    </body>

This template is rendered to::

    >>> req = Request.blank('/school_of_engineering.html')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/html; charset=UTF-8
    ...
    <body>
      <table>
        <tr><th colspan="3">Departments in the School of Engineering</th></tr>
        <tr><th>No</th><th>Code</th><th>Name</th></tr>
        <tr><td>1</td><td>be</td><td>Bioengineering</td></tr>
        <tr><td>2</td><td>comp</td><td>Computer Science</td></tr>
        <tr><td>3</td><td>ee</td><td>Electrical Engineering</td></tr>
        <tr><td>4</td><td>me</td><td>Mechanical Engineering</td></tr>
      </table>
    </body>

Function ``htsql()`` could also be used to embed rendered HTSQL output into
templates.  For example, template ``rex.db_demo/static/www/school_codes.js_t``
generates a list of all school codes::

    var data = {{ htsql("/school.code :as school_codes", 'json') }};

This list is rendered as a JSON array::

    >>> req = Request.blank('/school_codes.js_t')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: application/javascript; charset=UTF-8
    ...
    var data = {
      "school_codes": [
        "art",
        "bus",
        "edu",
        ...
      ]
    }
    ;


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

You can also use :class:`rex.db.Query`, which abstracts executing and
formatting raw HTSQL queries and ``.htsql`` files.  For example, command
``/campuses`` defined in :mod:`rex.db_demo` uses :meth:`.Query.format` to
render query output in HTML::

    from rex.web import Command
    from rex.db import Query
    from webob import Response

    class CampusesCommand(Command):

        path = 'campuses'
        access = 'anybody'

        def render(self, req):
            query = Query("/school^campus :as campuses")
            body = query.format('html')
            return Response(body=body)

The response is HTML generated by HTSQL formatter::

    >>> req = Request.blank('/campuses')
    >>> print req.get_response(demo)        # doctest: +ELLIPSIS
    200 OK
    Content-Type: text/html; charset=UTF-8
    ...
    <tbody>
    <tr class="htsql-odd-row"><td class="htsql-index">1</td><td class="htsql-text-type">north</td></tr>
    <tr class="htsql-even-row"><td class="htsql-index">2</td><td class="htsql-text-type">old</td></tr>
    <tr class="htsql-odd-row"><td class="htsql-index">3</td><td class="htsql-text-type">south</td></tr>
    </tbody>
    ...

HTSQL instance provides a number of methods for rendering HTSQL output.  You
can use method :meth:`.RexHTSQL.accept()` to detect expected output format,
:meth:`.RexHTSQL.emit_headers()` to generate a list of HTTP headers, and
:meth:`.RexHTSQL.emit()` generate HTSQL output::

    >>> from rex.db import get_db
    >>> with demo:
    ...     db = get_db()

    >>> req = Request.blank('/', accept='application/json')

    >>> with db:
    ...     with db.transaction():
    ...         product = db.produce("/school{code, name}")
    ...         format = db.accept(req)
    ...         headers = db.emit_headers(format, product)
    ...         body = "".join(db.emit(format, product))

    >>> print headers           # doctest: +NORMALIZE_WHITESPACE
    [('Content-Type', 'application/javascript'),
     ('Content-Disposition', 'inline; filename="school.js"'),
     ('Vary', 'Accept')]

    >>> print body              # doctest: +NORMALIZE_WHITESPACE, +ELLIPSIS
    {
      "school": [
        {
          "code": "art",
          "name": "School of Art & Design"
        },
        ...
      ]
    }

Here, we use ``with db`` clause to establish HTSQL context and ``with
db.transaction()`` to wrap all queries executed in the ``with`` body in a
single transaction.  Note that :mod:`rex.db` establishes an HTSQL context and
opens a transaction for every incoming HTTP request, so you don't need to use
these clauses in request handlers.  Sometimes, however, you may want to
establish a dedicated HTSQL context using :meth:`.RexHTSQL.isolate()`::

    >>> with db.isolate():
    ...     print db.produce("count(school^campus)")
    3

In particular, you must use an isolated HTSQL context in any implementation of
:class:`rex.web.Authenticate`.


Session and masking
===================

Method :meth:`.RexHTSQL.mask()` allows you to set an unconditional mask on a
table.  The mask affects all queries that are executed in the current HTSQL
context::

    >>> with db:
    ...     with db.mask("school?campus='south'"):
    ...         print db.produce("/school{code, campus}")
    ...         print db.produce("/program{code, school.campus}")
    ...         print db.produce("/department{code, school.campus}")    # doctest: +ELLIPSIS
    ({'bus', 'south'}, {'mus', 'south'})
    ({'gecon', 'south'}, {'pacc', 'south'}, {'pbusad', 'south'}, ..., {'uecon', 'south'})
    ({'acc', 'south'}, {'arthis', null}, {'astro', null}, ..., {'win', 'south'})

Similarly, :meth:`.RexHTSQL.session()` sets the value of ``$USER`` for all
queries in the HTSQL context::

    >>> with db:
    ...     with db.session("xi@rexdb.com"):
    ...         print db.produce("$USER")
    'xi@rexdb.com'

:mod:`rex.db` configures the session and the set of masks for all HTTP
handlers.  The value of ``$USER`` is set to the name of the authenticated user.
Masks are generated using :class:`rex.db.Mask` interface, which produces a list
of masks for the given HTTP request::

    from rex.web import authorize
    from rex.db import Mask

    class MaskStudy(Mask):

        def __call__(self, req):
            masks = ["study?exists(study_access.user=$USER)"]
            if not authorize(req, 'phi_access'):
                masks.append("identity?false")
            return masks

Here we allow the users to only see studies for which they have a respective
record in ``study_access`` table.  We also completely hide the ``identity``
table unless the current user has the ``phi_access`` role.


