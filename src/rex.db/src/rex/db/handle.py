#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


"""
This package provides database access to RexDB applications.
"""


from rex.core import (
        get_packages, Initialize, Error, StrVal, MaybeVal, MapVal, RecordVal)
from rex.web import HandleFile, HandleLocation, authorize, confine, get_jinja
from .database import get_db
from webob import Response
from webob.exc import HTTPUnauthorized, HTTPNotFound, HTTPMovedPermanently
from htsql.core.error import HTTPError
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers
import re
import urllib.request, urllib.parse, urllib.error


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


class HandleHTSQLLocation(HandleLocation):
    """
    Gateway to HTSQL service.

    HTSQL queries could be submitted either as a ``GET`` path
    or in the body of a ``POST`` request.
    """

    path = '*'

    @classmethod
    def enabled(cls):
        return ('rex.rdoma' not in get_packages())

    def __call__(self, req):
        # Check if the request has access to the service.
        if not authorize(req, self):
            raise HTTPUnauthorized()
        # Obtain HTSQL instance.
        gateway = None
        segment = req.path_info_peek()
        if re.match(r'\A@[A-Za-z_][0-9A-Za-z_]*\Z', segment):
            req = req.copy()
            req.path_info_pop()
            if not req.path_info:
                raise HTTPMovedPermanently(add_slash=True)
            gateway = segment[1:]
        try:
            db = get_db(gateway)
        except KeyError:
            raise HTTPNotFound()
        # Unpack HTSQL queries tunneled in a POST body.
        if (req.method == 'POST' and
                req.path_info == '/' and req.query_string == ''):
            path_info = req.body
            query_string = ''
            if '?' in path_info:
                path_info, query_string = path_info.split('?', 1)
            path_info = urllib.parse.unquote(path_info)
            req = req.copy()
            req.method = 'GET'
            req.path_info = path_info
            req.query_string = query_string
        # Gateway to HTSQL.
        with confine(req, self):
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
    `db`
        A name or an instance of HTSQL database. If not provided then the
        default HTSQL database will be used.
    """

    # Pattern to recognize a path to a `.htsql` file.
    path_re = re.compile(r'\A[\w.]+[:][\w./-]+[.][h][t][s][q][l]\Z')
    # File format for `.htsql` file.
    validate = RecordVal([('query', StrVal()),
                          ('parameters',
                              MapVal(StrVal(), MaybeVal(StrVal())),
                              {})])

    def __init__(self, path_or_query, db=None, parameters=None):
        self.path_or_query = path_or_query
        self.db = db
        # If the input is a path to `.htsql` file, parse the file.
        if self.path_re.match(self.path_or_query):
            packages = get_packages()
            spec = self.validate.parse(packages.open(path_or_query))
            self.query = spec.query
            self.parameters = spec.parameters
        # Otherwise, treat the input as an HTSQL query.
        else:
            self.query = path_or_query
            # ``None`` means we don't do any parameter validation before
            # executing query
            self.parameters = None

        if parameters:
            if self.parameters is None:
                self.parameters = parameters
            else:
                self.parameters.update(parameters)


    def get_db(self):
        """ Get configured HTSQL database instance."""
        db = self.db
        if db is None:
            db = get_db()
        elif isinstance(db, str):
            db = get_db(db)
        return db

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
        except Error as error:
            return req.get_response(error)
        # Execute the query and render the output.
        with self.get_db():
            try:
                product = produce(self.query, parameters)
                format = accept(req.environ)
                headerlist = emit_headers(format, product)
                # Pull whole output to avoid random "HTSQL application is not
                # activated" errors.  FIXME: how?
                app_iter = list(emit(format, product))
            except HTTPError as error:
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
        with self.get_db():
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
        with self.get_db():
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


class InitializeDB(Initialize):
    # On startup, checks if the connection parameters are valid.

    @classmethod
    def enabled(cls):
        return ('rex.rdoma' not in get_packages())

    def __call__(self):
        # Check if we can connect to the database.
        try:
            get_db()
        except ImportError as exc:
            raise Error(str(exc))
        # Add HTSQL-related globals to the Jinja environment.
        jinja = get_jinja()
        jinja.globals.update({
            'htsql': jinja_global_htsql,
        })


