#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
This package provides database access to RexDB applications.
"""


from rex.core import (Extension, Setting, Initialize, cached, get_settings,
        get_packages, Error, Validate, StrVal, MaybeVal, OneOrSeqVal,
        MapVal, RecordVal, UnionVal, OnScalar, OnField)
from rex.web import (Pipe, HandleFile, HandleLocation, authenticate, authorize,
        get_jinja)
from webob import Request, Response
from webob.exc import HTTPUnauthorized, HTTPNotFound, HTTPBadRequest
from htsql import HTSQL
from htsql.core.error import Error as HTSQLError, HTTPError
from htsql.core.util import DB
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept, Accept
from htsql.core.fmt.emit import emit, emit_headers
from htsql.core.context import context
from htsql.core.connect import connect, transaction
from htsql_rex import isolate, mask, session
import re
import urllib


class DBVal(Validate):
    """
    Accepts and parses HTSQL connection URI.
    """

    def __call__(self, data):
        try:
            return DB.parse(data)
        except ValueError, exc:
            raise Error(str(exc))


class DBSetting(Setting):
    """
    Database configuration.

    The must be either database connection URI or full HTSQL configuration.

    Database connection URI must have the form::

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

    HTSQL configuration is a dictionary that maps addon names to addon
    configuration.  Addon configuration is a dictionary that maps addon
    parameters to parameter values.

    Examples::

        db: sqlite:///sandbox/htsql_demo.sqlite

        db: pgsql://htsql_demo:demo@localhost/htsql_demo

        db:
            engine: mysql
            database: htsql_demo

        db:
            htsql:
              db: pgsql:rexdb_demo
            tweak.meta:
            tweak.shell.default:
            tweak.timeout:
                timeout: 600
            tweak.autolimit:
                limit: 10000

    This setting could be specified more than once.  Configuration
    parameters preset by different packages are merged into one.
    """

    name = 'db'
    validate = UnionVal(
            (OnScalar, DBVal),
            (OnField('database'), DBVal),
            OneOrSeqVal(MapVal(StrVal, MaybeVal(MapVal(StrVal)))))

    @classmethod
    def merge(cls, old_value, new_value):
        # Merges configuration preset in different packages.
        value = []
        for old_or_new_value in [new_value, old_value]:
            if old_or_new_value:
                if isinstance(old_or_new_value, list):
                    value.extend(old_or_new_value)
                elif isinstance(old_or_new_value, dict):
                    value.append(old_or_new_vale)
                else:
                    value.append({'htsql': {'db': old_or_new_value}})
        return value


class DBGatewaysSetting(Setting):
    """
    Database configuration for secondary databases.

    Use this setting to specify additional application databases.

    The setting value is a dictionary that maps a name to connection
    URI or full HTSQL configuration.

    Examples::

        db_gateways:

            input:
                tweak.filedb:
                    sources:
                    - file: ./csv/family.csv
                    - file: ./csv/individua.csv
                    - file: ./csv/measure.csv

            target: mssql://10.0.0.2/target

    This setting could be specified more than once.  Configuration
    parameters preset by different packages are merged into one.
    """

    name = 'db_gateways'
    validate = MapVal(StrVal(r'[A-Za-z_][0-9A-Za-z_]*'),
                      MaybeVal(DBSetting.validate))
    default = {}

    @classmethod
    def merge(cls, old_value, new_value):
        # Merges configuration preset in different packages.
        if not (isinstance(old_value, dict) and isinstance(new_value, dict)):
            return new_value
        value = dict((key, old_value[key])
                     for key in old_value if old_value[key])
        for key in sorted(new_value):
            if key in value:
                if new_value[key] is None:
                    del value[key]
                else:
                    value[key] = DBSetting.merge(value[key], new_value[key])
            else:
                value[key] = new_value[key]
        return value


class HTSQLExtensionsSetting(Setting):
    """
    Configuration of HTSQL extensions for the primary database.

    Use this setting to preset HTSQL configuration for a particular
    application or to override the preset HTSQL configuration.

    The value of this setting is a dictionary that maps addon names
    to addon configuration.  Addon configuration is a dictionary mapping
    addon parameters to parameter values.

    Example::

        htsql_extensions:
            tweak.meta:
            tweak.shell.default:
            tweak.timeout:
                timeout: 600
            tweak.autolimit:
                limit: 10000

    This setting could be specified more than once.  Configuration
    parameters preset by different packages are merged into one.
    """

    name = 'htsql_extensions'
    validate = OneOrSeqVal(MapVal(StrVal, MaybeVal(MapVal(StrVal))))
    default = None

    @classmethod
    def merge(cls, old_value, new_value):
        # Merges configuration preset in different packages.
        value = []
        for old_or_new_value in [new_value, old_value]:
            if old_or_new_value:
                if isinstance(old_or_new_value, list):
                    value.extend(old_or_new_value)
                else:
                    value.append(old_or_new_value)
        return value


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

    @classmethod
    def enabled(cls):
        return ('rex.rdoma' not in get_packages())

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


class PipeTransaction(Pipe):
    """
    Wraps HTTP request in a transaction.
    """

    priority = 'transaction'
    after = 'error'
    before = 'routing'

    def __call__(self, req):
        user = lambda authenticate=authenticate, req=req: authenticate(req)
        masks = [lambda mask_type=mask_type, req=req: mask_type()(req)
                 for mask_type in Mask.all()]
        with get_db(), transaction(is_lazy=True), session(user), mask(*masks):
            return self.handle(req)


class HandleHTSQLLocation(HandleLocation):
    # Gateway to HTSQL service.

    path = '*'

    @classmethod
    def enabled(cls):
        return ('rex.rdoma' not in get_packages())

    def __call__(self, req):
        # Check if the request has access to the service.
        if not authorize(req, self.package()):
            raise HTTPUnauthorized()
        # Obtain HTSQL instance.
        gateway = None
        segment = req.path_info_peek()
        if re.match(r'\A@[A-Za-z_][0-9A-Za-z_]*\Z', segment):
            req = req.copy()
            req = req.path_info_pop()
            if not req.path_info:
                raise HTTPMovedPermanently(add_slash=True)
            gateway = segment[1:]
        db = get_db(gateway)
        if db is None:
            raise HTTPNotFound()
        # Unpack HTSQL queries tunneled in a POST body.
        if (req.method == 'POST' and
                req.path_info == '/' and req.query_string == ''):
            path_info = req.body
            query_string = ''
            if '?' in path_info:
                path_info, query_string = path_info.split('?', 1)
            path_info = urllib.unquote(path_info)
            req = req.copy()
            req.method = 'GET'
            req.path_info = path_info
            req.query_string = query_string
        # Gateway to HTSQL.
        return req.get_response(db)


class HandleHTSQLFile(HandleFile):
    # Interprets `*.htsql` files.

    ext = '.htsql'

    @classmethod
    def enabled(cls):
        return ('rex.rdoma' not in get_packages())

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
            spec = self.validate.parse(packages.open(path_or_query))
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
                product = produce(self.query, parameters)
                format = accept(req.environ)
                headerlist = emit_headers(format, product)
                # Pull whole output to avoid random "HTSQL application is not
                # activated" errors.  FIXME: how?
                app_iter = list(emit(format, product))
            except HTTPError, error:
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
            return produce(self.query, parameters)

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
            product = produce(self.query, parameters)
            return "".join(emit(content_type, product))

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


class RexHTSQL(HTSQL):
    """
    Customized variant of HTSQL application.
    """

    # We can add our own methods here.

    def __enter__(self):
        if context.active_app is self:
            context.push(context.active_app, context.active_env)
        else:
            super(RexHTSQL, self).__enter__()

    def produce(self, command, environment=None, **parameters):
        product = None
        with self:
            if hasattr(command, 'read'):
                blocks = []
                lines = []
                stream = command
                block_idx = 0
                for idx, line in enumerate(stream):
                    if not line.strip() or line.startswith('#'):
                        if lines:
                            lines.append(line)
                    elif line == line.lstrip():
                        if lines:
                            blocks.append((block_idx, lines))
                        block_idx = idx
                        lines = [line]
                    else:
                        if not lines:
                            raise HTSQLError("Got unexpected indentation",
                                             "%s, line %s"
                                             % (stream.name, idx+1))
                        lines.append(line)
                if lines:
                    blocks.append((block_idx, lines))
                for idx, lines in blocks:
                    while lines and not lines[-1]:
                        lines.pop()
                    command = "\n".join(lines)
                    try:
                        product = produce(command, environment, **parameters)
                    except HTSQLError, error:
                        error.wrap("While executing",
                                   "%s, line %s" % (stream.name, idx+1))
                        raise
            else:
                product = produce(command, environment, **parameters)
        return product

    def isolate(self):
        """
        Creates a fresh HTSQL context.

        Use this method with a ``with`` clause.
        """
        return isolate(self)

    def mask(self, *masks):
        """
        Creates a unconditional filter on a table.

        `masks`
            A sequence of masks.  Each mask must be an HTSQL expression
            of the form ``<table>?<filter>``.

        Use this method with a ``with`` clause.
        """
        return mask(*masks)

    def session(self, user):
        """
        Sets the value of ``$USER``.

        `user`
            The name of the user or ``None``.  This value is available
            in HTSQL queries as ``$USER`` parameter.

        Use this method with a ``with`` clause.
        """
        return session(user)

    def accept(self, environ):
        """
        Determines the preferable HTSQL output format.

        `environ`
            WSGI ``environ`` object or ``Request`` object.
        """
        if isinstance(environ, (str, unicode)):
            content_type = environ
            if '/' not in content_type:
                content_type = "x-htsql/"+content_type
            with self:
                return Accept.__invoke__(content_type)
        if isinstance(environ, Request):
            environ = environ.environ
        with self:
            return accept(environ)

    def emit(self, format, product):
        """
        Generates the body of the HTSQL output in the specified format.
        """
        with self:
            return emit(format, product)

    def emit_headers(self, format, product):
        """
        Generates HTTP headers for the HTSQL output.
        """
        with self:
            return emit_headers(format, product)

    def connect(self, with_autocommit=False):
        """
        Opens a connection to the database.
        """
        with self:
            return connect(with_autocommit=with_autocommit)

    def transaction(self, is_lazy=False):
        """
        Creates a transactional context.

        Use this method with a ``with`` clause.
        """
        return transaction(is_lazy=is_lazy)


class Mask(Extension):
    """
    Generates a list of masks to apply to the given HTTP request.
    """

    def __call__(self, req):
        """
        Implementations should override this method to return a list
        of masks for the given HTTP request.
        """
        return []


@cached
def get_db(name=None):
    """
    Builds and returns an HTSQL instance.

    `name`
        If ``name`` is not provided, returns the primary application
        database.  Otherwise, returns the named gateway.
    """
    # Build configuration from settings `db`, `htsql_extensions` and
    # `htsql_base_extensions`.  Also include `rex` HTSQL addon.
    settings = get_settings()
    configuration = []
    if name is None:
        if isinstance(settings.db, list):
            configuration.append(None)
            configuration.extend(settings.db)
        elif isinstance(settings.db, dict):
            configuration.append(None)
            configuration.append(settings.db)
        else:
            configuration.append(settings.db)
        gateways = dict((key, get_db(key))
                        for key in sorted(settings.db_gateways)
                        if settings.db_gateways[key])
        configuration.append({'rex': {'gateways': gateways}})
        if settings.htsql_extensions:
            if isinstance(settings.htsql_extensions, list):
                configuration.extend(settings.htsql_extensions)
            else:
                configuration.append(settings.htsql_extensions)
    else:
        gateway = settings.db_gateways.get(name)
        if not gateway:
            return None
        if isinstance(gateway, list):
            configuration.append(None)
            configuration.extend(gateway)
        elif isinstance(gateway, dict):
            configuration.append(None)
            configuration.append(gateway)
        else:
            configuration.append(gateway)
        configuration.append({'rex': {}})
    return RexHTSQL(*configuration)


