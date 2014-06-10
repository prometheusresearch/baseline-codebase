#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import Error
from rex.db import get_db
from .arm import RootArm, ArmDumper
from .grow import Grow
from htsql.core.util import maybe, listof
from htsql.core.domain import Value
from htsql.core.connect import transaction
from htsql.core.syn.syntax import VoidSyntax
from htsql.core.cmd.embed import Embed
from htsql.core.tr.bind import BindingState
from htsql.core.tr.binding import RootBinding
from htsql.core.tr.translate import translate
from htsql.core.fmt.accept import accept
from htsql.core.fmt.emit import emit, emit_headers
from webob import Response
import urllib
import json
import yaml


class Constraint(object):

    @classmethod
    def parse(cls, data):
        if isinstance(data, Constraint):
            return data
        original = data
        if isinstance(data, str):
            if '=' in data:
                path, values = data.split('=', 1)
                path = urllib.unquote(path)
                if ':' in path:
                    path, method = path.split(':', 1)
                else:
                    method = None
                values = urllib.unquote(values)
                if values:
                    values = [values]
                else:
                    values = []
            else:
                path = urllib.unquote(data)
                if ':' in path:
                    path, method = path.split(':', 1)
                else:
                    method = None
                values = []
            data = (path, method, values)
        if isinstance(data, tuple) and len(data) == 2:
            path, values = data
            method = None
        elif isinstance(data, tuple) and len(data) == 3:
            path, method, values = data
        else:
            raise Error("Ill-formed constraint:", original)
        if isinstance(path, str):
            path = path.decode('utf-8', 'replace')
        if isinstance(path, unicode):
            path = tuple(path.split(u'.'))
        if isinstance(path, tuple):
            path = tuple(name.decode('utf-8', 'replace')
                         if isinstance(name, str) else name
                         for name in path)
        if isinstance(method, str):
            method = method.decode('utf-8', 'replace')
        if not isinstance(values, list):
            values = [values]
        try:
            values = [Embed.__invoke__(value) for value in values]
        except TypeError, exc:
            raise Error("Ill-formed constraint:", original) \
                  .wrap("Failed to adapt the value:", str(exc))
        return cls(path, method, values)

    def __init__(self, path, method, values):
        assert isinstance(list(path), listof(unicode)), path
        assert isinstance(method, maybe(unicode)), method
        assert isinstance(values, listof(Value)), values
        self.path = path
        self.method = method
        self.values = values

    def matches(self, depth, name):
        if len(self.path) > depth:
            return (self.path[depth] == name)
        else:
            return (name is None)

    def get(self, depth):
        if len(self.path) > depth:
            return self.path[depth]
        else:
            return None

    def merge(self, values):
        return self.__class__(self.path, self.method, self.values+values)

    def __str__(self):
        path = urllib.quote(".".join(name.encode('utf-8')
                            for name in self.path))
        if self.method is not None:
            method = ":"+urllib.quote(self.method.encode('utf-8'))
        else:
            method = ""
        if not self.values:
            values = [""]
        else:
            values = [value.domain.dump(value.data).encode('utf-8')
                      for value in self.values]
        return "&".join("%s%s=%s" % (path, method, urllib.quote(value))
                        for value in values)

    def __repr__(self):
        return "%s(%r, %r, %r)" % (self.__class__.__name__,
                                   self.path, self.method, self.values)


class ConstraintSet(object):

    @classmethod
    def parse(cls, *args, **kwds):
        constraints = []
        for arg in args:
            if isinstance(arg, str):
                constraints.extend(Constraint.parse(item)
                                   for item in arg.split('&')
                                   if item)
            else:
                constraints.append(Constraint.parse(arg))
        for item in sorted(kwds.items()):
            constraints.append(Constraint.parse(item))
        merged_constraints = []
        indexes = {}
        for constraint in constraints:
            key = (constraint.path, constraint.method)
            if key in indexes:
                index = indexes[key]
                merged_constraints[index] = \
                        merged_constraints[index].merge(constraint.values)
            else:
                indexes[key] = len(merged_constraints)
                merged_constraints.append(constraint)
        return cls(0, merged_constraints)

    def __init__(self, depth, constraints):
        self.depth = depth
        self.constraints = constraints

    def dispatch(self, names):
        dispatch = { None: [] }
        for constraint in self.constraints:
            name = constraint.get(self.depth)
            if name is not None and name not in names:
                raise Error("Invalid constraint path:", str(constraint))
            dispatch.setdefault(name, []).append(constraint)
        dispatch[None] = ConstraintSet(self.depth, dispatch[None])
        for name in names:
            dispatch[name] = ConstraintSet(self.depth+1, dispatch.get(name, []))
        return dispatch

    def __len__(self):
        return len(self.constraints)

    def __iter__(self):
        return iter(self.constraints)

    def __str__(self):
        return "&".join(str(constraint) for constraint in self.constraints)

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__,
                               self.depth, self.constraints)


class Port(object):

    def __init__(self, tree=None):
        if tree is None:
            tree = RootArm([])
        if not isinstance(tree, RootArm):
            with get_db():
                grow = Grow.parse(tree)
                tree = grow(RootArm([]))
        self.tree = tree

    def __str__(self):
        return yaml.dump(self.tree.to_yaml(), Dumper=ArmDumper).rstrip()

    def __repr__(self):
        if not self.tree:
            return "%s()" % self.__class__.__name__
        else:
            return "%s('''\n%s\n''')" % (self.__class__.__name__, self)

    def grow(self, stream):
        with get_db():
            grow = Grow.parse(stream)
            tree = grow(self.tree)
        return self.__class__(tree)

    def produce(self, *args, **kwds):
        with get_db():
            constraints = ConstraintSet.parse(*args, **kwds)
            state = BindingState(RootBinding(VoidSyntax()))
            binding = self.tree.bind(state, constraints)
            pipe = translate(binding)
            return pipe()(None)

    def replace(self, old, new):
        if isinstance(old, (str, unicode)):
            old = json.loads(old)
        if isinstance(new, (str, unicode)):
            new = json.loads(new)
        with get_db():
            with transaction():
                old = self.tree.adapt(old)
                new = self.tree.adapt(new)
                old = self.tree.flatten(old)
                new = self.tree.flatten(new)
                difference = self.tree.pair(old, new)
                difference = self.tree.restore(difference)
                changes = self.tree.patch(difference)
                constraints = self.tree.restrict(changes)
                state = BindingState(RootBinding(VoidSyntax()))
                binding = self.tree.bind(state, constraints)
                pipe = translate(binding)
                output = pipe()(None)
        return output

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
            raise Error("Unexpected method:", req.method)
        with get_db():
            format = accept(req.environ)
            headerlist = emit_headers(format, product)
            app_iter = list(emit(format, product))
            return Response(headerlist=headerlist, app_iter=app_iter)


