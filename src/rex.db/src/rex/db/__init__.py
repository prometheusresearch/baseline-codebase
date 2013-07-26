#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
This package provides database access to RexDB applications.
"""


from rex.core import (Setting, Initialize, cached, get_settings, StrVal,
        Validate, Error, MaybeVal, MapVal, RecordVal, get_packages)
from rex.web import HandleFile, HandleLocation, authorize, get_jinja
from webob import Response
from webob.exc import HTTPUnauthorized, HTTPNotFound, HTTPBadRequest
import htsql
import htsql.core.error
import htsql.core.util
import htsql.core.wsgi
import htsql.core.cmd.act
import htsql.core.fmt.accept
import htsql.core.fmt.emit
import re
import yaml


class DBVal(Validate):
    """
    Accepts and parses HTSQL connection URI.
    """

    def __call__(self, data):
        try:
            return htsql.core.util.DB.parse(data)
        except ValueError, exc:
            raise Error(str(exc))


class DBSetting(Setting):
    """
    Database connection URI; must have the form::

        <engine>://<username>:<password>@<host>:<port>/<database>

    `<engine>`
        Type of the database server, e.g., ``sqlite``, ``pgsql``, ``mysql``.
    `<username>:<password>`
        Authentication parameters.
    `<host>:<port>`
        The address of the database server.
    `<database>`
        The name of the database; for SQLite, the path to the database file.

    All parameters except ``<engine>`` and ``<database>`` are optional.

    The connection parameters could be also provided as a record with fields
    ``engine``, ``username``, ``password``, ``host``, ``port``, ``database``.

    Examples::

        db: sqlite:///sandbox/htsql_demo.sqlite

        db: pgsql://htsql_demo:demo@localhost/htsql_demo

        db:
            engine: mysql
            database: htsql_demo
    """

    name = 'db'
    validate = DBVal()


class HTSQLBaseExtensionsSetting(Setting):
    """
    Configuration of HTSQL extensions.

    Use this setting to preset HTSQL configuration for a particular
    application.

    The value of this setting is a dictionary that maps addon names
    to addon configuration.  Addon configuration is a dictionary mapping
    addon parameters to parameter values.

    Example::

        htsql_base_extensions:
            tweak.meta:
            tweak.shell.default:
            tweak.timeout:
                timeout: 600
            tweak.autolimit:
                limit: 10000
    """

    name = 'htsql_base_extensions'
    validate = MaybeVal(MapVal(StrVal(), MaybeVal(MapVal(StrVal()))))
    default = None


class HTSQLExtensionsSetting(HTSQLBaseExtensionsSetting):
    """
    Configuration of HTSQL extensions.

    Use this setting to override the preset HTSQL configuration.

    Example::

        htsql_extensions:
            tweak.timeout:
                timeout: 30
    """

    name = 'htsql_extensions'


class HTSQLAccessSetting(Setting):
    """
    Permission to access the HTSQL service.

    Set to ``None`` to disable HTSQL service.  The default value is
    ``'authenticated'``.

    Example::

        htsql_access: anybody
    """

    name = 'htsql_access'
    validate = MaybeVal(StrVal())
    default = 'authenticated'


def jinja_global_htsql(path_or_query, content_type=None,
                       environment=None, **arguments):
    """
    Jinja global ``htsql`` that executes an HTSQL query and returns the result.

    `path_or_query`
        HTSQL query or a package path to a ``.htsql`` file.
    `content_type`
        Output format or ``None``.
    `environment`, `arguments`
        Dictionaries with query parameters.

    *Returns:* if ``content_type`` is ``None``, returns the output data,
    otherwise, returns the rendered output in the given format.
    """
    query = Query(path_or_query)
    if content_type is None:
        product = query.produce(environment, **arguments)
        return product.data
    else:
        return query.format(content_type, environment, **arguments)


class InitializeDB(Initialize):
    # On startup, checks if the connection parameters are valid.

    def __call__(self):
        # Check if we can connect to the database.
        try:
            get_db()
        except ImportError, exc:
            raise Error(str(exc))
        # Add HTSQL-related globals to the Jinja environment.
        jinja = get_jinja()
        jinja.globals.update({
            'htsql': jinja_global_htsql,
        })


class HandleHTSQLLocation(HandleLocation):
    # Gateway to HTSQL service.

    path = '*'

    def __call__(self, req):
        # Check if the service is enabled or not.
        settings = get_settings()
        if settings.htsql_access is None:
            raise HTTPNotFound()
        # Check if the request has access to the service.
        if not authorize(req, settings.htsql_access):
            raise HTTPUnauthorized()
        # Gateway to HTSQL.
        return req.get_response(get_db())


class HandleHTSQLFile(HandleFile):
    # Interprets `*.htsql` files.

    ext = '.htsql'

    def __call__(self, req):
        # Load and validate the `.htsql` file.
        query = Query(self.path)
        return query(req)


class Query(object):
    """
    Wraps ``.htsql`` files and HTSQL queries.

    `path_or_query`
        An HTSQL query or a path to a ``.htsql`` file.
    """

    # Pattern to recognize a path to a `.htsql` file.
    path_re = re.compile(r'\A[\w.]+[:][\w./-]+[.][h][t][s][q][l]\Z')
    # File format for `.htsql` file.
    validate = RecordVal([('query', StrVal()),
                          ('parameters',
                              MapVal(StrVal(), MaybeVal(StrVal())),
                              {})])

    def __init__(self, path_or_query):
        self.path_or_query = path_or_query
        # If the input is a path to `.htsql` file, parse the file.
        if self.path_re.match(self.path_or_query):
            packages = get_packages()
            spec = self.validate(yaml.safe_load(packages.open(path_or_query)))
            self.query = spec.query
            self.parameters = spec.parameters
        # Otherwise, treat the input as an HTSQL query.
        else:
            self.query = path_or_query
            self.parameters = None

    def __repr__(self):
        return "%s(%r)" % (self.__class__.__name__, self.path_or_query)

    def __call__(self, req):
        """
        Executes the query taking query parameters from the HTTP request.

        `req`
            HTTP request object.

        *Returns:* rendered query output as an HTTP response.
        """
        # Parse input parameters.
        try:
            parameters = self._merge(req.params)
        except Error, error:
            return req.get_response(error)
        # Execute the query and render the output.
        with get_db():
            try:
                product = htsql.core.cmd.act.produce(self.query, parameters)
                format = htsql.core.fmt.accept.accept(req.environ)
                headerlist = htsql.core.fmt.emit.emit_headers(format, product)
                # Pull whole output to avoid random "HTSQL application is not
                # activated" errors.  FIXME: how?
                app_iter = list(htsql.core.fmt.emit.emit(format, product))
            except htsql.core.error.HTTPError, error:
                return req.get_response(error)
            resp = Response(headerlist=headerlist, app_iter=app_iter)
        return resp

    def produce(self, environment=None, **arguments):
        """
        Executes the query; produces the query output.

        `environment`, `arguments`
            Dictionaries with query parameters.
        """
        parameters = self._merge(environment, **arguments)
        with get_db():
            return htsql.core.cmd.act.produce(self.query, parameters)

    def format(self, content_type, environment=None, **arguments):
        """
        Executes the query; returns rendered output in the given format.

        `content_type`
            Output format accepted by HTSQL.  Must be content type or HTSQL
            formatter name, e.g., ``application/json`` or ``raw``.
        `environment`, `arguments`
            Dictionaries with query parameters.
        """
        # Allow to use a formatter name in place of the content type.
        if '/' not in content_type:
            content_type = 'x-htsql/'+content_type
        # Merge default and input parameters.
        parameters = self._merge(environment, **arguments)
        # Execute the query and render the output.
        with get_db():
            product = htsql.core.cmd.act.produce(self.query, parameters)
            return "".join(htsql.core.fmt.emit.emit(content_type, product))

    def _merge(self, environment, **arguments):
        # Validates the input parameters, merge them with default parameters.
        if environment is None:
            environment = {}
        # Complain about unexpected input parameters.
        if self.parameters is not None:
            for name in sorted(environment)+sorted(arguments):
                if name not in self.parameters:
                    raise Error("Received unexpected parameter:", name)
        # Merge all parameters.
        parameters = {}
        if self.parameters is not None:
            parameters.update(self.parameters)
        if environment:
            parameters.update(environment)
        parameters.update(arguments)
        return parameters


class RexHTSQL(htsql.HTSQL):
    """
    Customized variant of HTSQL application.
    """

    # We can add our own methods here.


@cached
def get_db():
    """
    Builds and returns an HTSQL instance.
    """
    # Build configuration from settings `db`, `htsql_extensions` and
    # `htsql_base_extensions`.  Also include `rex` HTSQL addon.
    settings = get_settings()
    configuration = []
    configuration.append(settings.db)
    configuration.append({'rex': {}})
    if settings.htsql_extensions:
        configuration.append(settings.htsql_extensions)
    if settings.htsql_base_extensions:
        configuration.append(settings.htsql_base_extensions)
    return RexHTSQL(*configuration)


