#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.db import get_db
from .arm import RootArm, ArmDumper
from .grow import Grow
from .constraint import ConstraintSet
from .produce import produce, describe
from .replace import replace
from htsql.core.connect import transaction
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers
from webob import Response
import yaml


class Port(object):

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

    def __str__(self):
        return yaml.dump(self.tree.to_yaml(), Dumper=ArmDumper).rstrip()

    def __repr__(self):
        args = []
        if self.tree:
            args.append("'''\n%s\n'''" % self)
        if self.db is not get_db():
            args.append("db=%r" % self.db)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def grow(self, stream):
        with self.db:
            grow = Grow.parse(stream)
            tree = grow(self.tree)
        return self.__class__(tree)

    def produce(self, *args, **kwds):
        with self.db:
            constraints = ConstraintSet.parse(*args, **kwds)
            return produce(self.tree, constraints)

    def describe(self, *args, **kwds):
        with self.db:
            constraints = ConstraintSet.parse(*args, **kwds)
            return describe(self.tree, constraints)

    def replace(self, old, new):
        with self.db:
            with transaction():
                return replace(self.tree, old, new)

    def insert(self, new):
        return self.replace(None, new)

    def update(self, new):
        return self.replace(None, new)

    def delete(self, old):
        return self.replace(old, None)

    def __call__(self, req):
        if req.method == 'GET':
            product = self.produce(req.query_string)
        elif req.method == 'POST':
            product = self.replace(req.POST.get('old'), req.POST.get('new'))
        else:
            raise HTTPMethodNotAllowed()
        with self.db:
            format = accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)


