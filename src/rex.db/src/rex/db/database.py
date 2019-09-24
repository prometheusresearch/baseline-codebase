#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Extension, cached, get_settings, Error
from rex.web import Pipe, authenticate
from .setting import HTSQLVal
from webob import Request, Response
from webob.exc import (
        HTTPUnauthorized, HTTPNotFound, HTTPBadRequest, HTTPMovedPermanently)
from htsql import HTSQL
from htsql.core.error import Error as HTSQLError
from htsql.core.cmd.act import produce
from htsql.core.fmt.accept import accept, Accept
from htsql.core.fmt.emit import emit, emit_headers
from htsql.core.context import context
from htsql.core.connect import connect, transaction
from htsql_rex import isolate, mask, session


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
        """
        Executes a query, returns the result.

        `command`
            A string or an open file.  If a file, may contain multiple
            queries.
        """
        product = None
        with self:
            if hasattr(command, 'read'):
                # Read queries from a file.
                stream = command
                name = getattr(stream, 'name', '<input>')
                # Statements.
                blocks = []
                # Lines in the current statement.
                lines = []
                # Location of the current statement.
                block_idx = 0
                for idx, line in enumerate(stream):
                    line = line.rstrip()
                    if not line or line.startswith('#'):
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
                                             % (name, idx+1))
                        lines.append(line)
                if lines:
                    blocks.append((block_idx, lines))
                for idx, lines in blocks:
                    while lines and not lines[-1]:
                        lines.pop()
                    command = "\n".join(lines)
                    try:
                        product = produce(command, environment, **parameters)
                    except HTSQLError as error:
                        error.wrap("While executing",
                                   "%s, line %s" % (name, idx+1))
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
        if isinstance(environ, str):
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

    @classmethod
    def configure(cls, name=None):
        # Build configuration from settings `db`, `htsql_extensions` and
        # `htsql_base_extensions`.  Also include `rex` HTSQL addon.
        settings = get_settings()
        configuration = []
        if name is None:
            gateways = dict((key, cls.configure(key))
                            for key in sorted(settings.gateways)
                            if settings.gateways[key])
            properties = settings.htsql_environment
            timeout = settings.query_timeout
            configuration = HTSQLVal.merge(
                    {'rex': {
                        'gateways': gateways,
                        'properties': properties,
                        'timeout': timeout }},
                    settings.htsql_extensions,
                    settings.db)
        else:
            gateway = settings.gateways.get(name)
            if not gateway:
                raise KeyError(name)
            configuration = HTSQLVal.merge({'rex': {}}, gateway)
        return cls(None, configuration)


class PipeTransaction(Pipe):
    # Wraps HTTP request in a transaction.

    priority = 'transaction'
    after = 'error'
    before = 'routing'

    def __call__(self, req):
        settings = get_settings()
        user = lambda authenticate=authenticate, req=req: authenticate(req)
        masks = [lambda mask_type=mask_type, req=req: mask_type()(req)
                 for mask_type in Mask.all()]
        with get_db(), session(user), mask(*masks), transaction(is_lazy=True):
            if settings.read_only:
                with context.env(can_write=False):
                    return self.handle(req)
            else:
                return self.handle(req)


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
        database.  Otherwise, returns the named gateway.  If the gateway
        is not configured, raises :exc:`KeyError`.
    """
    return RexHTSQL.configure(name=name)
