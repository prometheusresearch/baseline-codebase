#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.web import authenticate
from rex.db import get_db
from .arm import RootArm, ArmDumper
from .grow import Grow
from .constraint import ConstraintSet
from .produce import produce, describe
from .replace import replace
from htsql_rex_port import named_ports
from htsql.core.context import context
from htsql.core.connect import transaction
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers
from webob import Response
import yaml


class Port:
    """
    Represents a slice of the database content.

    `tree`
        The schema slice represented in YAML format.
    `db`
        HTSQL instance; if not provided, obtained from :func:`rex.db.get_db()`.
    """

    def __init__(self, tree=None, db=None):
        if db is None:
            db = get_db()
        if tree is None:
            tree = RootArm([])
        elif not isinstance(tree, RootArm):
            with db:
                grow = Grow.parse(tree)
                tree = grow(RootArm([]))
        self.tree = tree
        self.db = db
        # This command cache is no longer used by rex.port,
        # but we keep it because it is used by rex.mart.
        self._command_cache = {}

    def __str__(self):
        # Renders YAML representation of the schema tree.
        return yaml.dump(
            self.tree.to_yaml(),
            Dumper=ArmDumper,
            default_flow_style=None,
        ).rstrip()

    def __repr__(self):
        args = []
        if self.tree or self.tree.parameters:
            args.append("'''\n%s\n'''" % self)
        if self.db is not get_db():
            args.append("db=%r" % self.db)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def grow(self, stream):
        """
        Updates the structure of the port.

        `stream`
            Contains updated port definitions in YAML format.

        Returns the updated port.
        """
        with self.db:
            grow = Grow.parse(stream)
            tree = grow(self.tree)
        return self.__class__(tree, self.db)

    def produce(self, *args, **kwds):
        """
        Returns data from the port.

        `*args`, `**kwds`
            Query constraints.
        """
        with self.db:
            constraints = ConstraintSet.parse(*args, **kwds)
            return produce(self.tree, constraints)

    def describe(self, *args, **kwds):
        """
        Returns HTSQL metadata for the port output.
        """
        with self.db:
            constraints = ConstraintSet.parse(*args, **kwds)
            return describe(self.tree, constraints)

    def replace(self, old, new, *args, **kwds):
        """
        Replaces ``old`` port data with ``new`` data.

        `old`, `new`
            Data in format compatible with port structure.  Could be
            represented in JSON format or as a collection of Python
            dictionaries and lists.  HTSQL ``Product`` values are also
            accepted.

        `*args`, `**kwds`
            Query constraints.
        """
        with self.db:
            constraints = ConstraintSet.parse(*args, **kwds)
            with transaction():
                command_cache = {}
                session_properties = context.env.session_properties
                if session_properties is not None:
                    command_cache = session_properties
                return replace(
                        self.tree, old, new, constraints, command_cache)

    def insert(self, new):
        """
        Adds new records to the database.

        `new`
            Data in format compatible with port structure.
        """
        return self.replace(None, new)

    def update(self, new):
        """
        Updates records in the database.

        `new`
            Data in format compatible with port structure.
        """
        return self.replace(None, new)

    def delete(self, old):
        """
        Deletes records from the database.

        `old`
            Data in format compatible with port structure.
        """
        return self.replace(old, None)

    def __call__(self, req):
        """
        Handles an HTTP request.

        ``GET`` HTTP requests are interpreted as :meth:`.produce()` calls.
        Query constraints are parsed from the request ``QUERY_STRING``.

        ``POST`` HTTP requests are interpreted as :meth:`.replace()` calls.
        The ``old`` and ``new`` parameters are taken from the respective POST
        parameters.  Query constraints are parsed from ``QUERY_STRING``.
        """
        if req.method == 'GET':
            product = self.produce(req.query_string, USER=authenticate(req))
        elif req.method == 'POST':
            product = self.replace(req.POST.get('old'), req.POST.get('new'),
                                   req.query_string, USER=authenticate(req))
        else:
            raise HTTPMethodNotAllowed()
        with self.db:
            format = product.format or accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)

    def declare(self, name):
        """
        Converts the port to an HTSQL command with the given name.

        Must be used as an argument of a ``with`` clause.
        """
        return named_ports(**{name: self})


