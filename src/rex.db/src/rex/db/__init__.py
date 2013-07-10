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


def jinja_global_htsql(query, environment=None, **arguments):
    """
    Jinja global ``htsql`` that executes an HTSQL query and returns the result.

    `query`
        HTSQL query.
    `environment`, `arguments`
        Dictionaries with query parameters.
    """
    db = get_db()
    product = db.produce(query, environment, **arguments)
    return product.data


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

    # File format.
    validate = RecordVal([('query', StrVal()),
                          ('parameters',
                              MapVal(StrVal(), MaybeVal(StrVal())),
                              {})])

    def __call__(self, req):
        # Load and validate the `.htsql` file.
        packages = get_packages()
        spec = self.validate(yaml.safe_load(packages.open(self.path)))
        # Report unexpected form parameters.
        try:
            for key in req.params:
                if key not in spec.parameters:
                    raise Error("Found unknown parameter:", key)
        except Error, error:
            # FIXME: copy/paste from `rex.web.Command`:
            # Trick WebOb into rendering the error properly in text mode.
            # FIXME: WebOb cuts out anything resembling a <tag>.
            body_template = None
            accept = req.environ.get('HTTP_ACCEPT', '')
            if not ('html' in accept or '*/*' in accept):
                error = str(error).replace("\n", "<br \>")
                body_template = """${explanation}<br /><br />${detail}"""
            raise HTTPBadRequest(error, body_template=body_template)
        # Extract query parameters from the HTTP request.
        environment = {}
        for name in sorted(spec.parameters):
            if name in req.params:
                environment[name] = req.params[name]
            else:
                environment[name] = spec.parameters[name]
        # Execute and render the query.
        with get_db():
            try:
                product = htsql.core.cmd.act.produce(spec.query, environment)
                format = htsql.core.fmt.accept.accept(req.environ)
                headerlist = htsql.core.fmt.emit.emit_headers(format, product)
                # Pull whole output to avoid random "HTSQL application is not
                # activated" errors.  FIXME: how?
                app_iter = list(htsql.core.fmt.emit.emit(format, product))
            except htsql.core.error.HTTPError, error:
                return req.get_response(error)
            resp = Response(headerlist=headerlist, app_iter=app_iter)
        return resp


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


