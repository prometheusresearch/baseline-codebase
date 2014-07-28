"""

    rex.widget.state.graph
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple, MutableMapping, Mapping

from .reference import Reference, parse_ref

class StateGraph(Mapping):

    def __init__(self, initial=None):
        self.storage = {}
        self.dependencies = {}
        self.dependents = {}

        if initial is not None:
            _merge_state_into(self, initial)

    def __iter__(self):
        return iter(self.storage)

    def __len__(self):
        return len(self.storage)

    def __getitem__(self, id):
        if ':' in id:
            id = id.split(':', 1)[0]
        return self.storage[id]

    def show(self):
        for id, deps in self.dependencies.items():
            print id, [(d.id, d.reset_only) for d in deps]

    def __str__(self):
        return "%s(storage=%s, dependents=%s)" % (
                self.__class__.__name__, self.storage, self.dependents)

    __repr__ = __str__

    def deref(self, ref):
        """ Dereference state reference to a value.

        :param ref: state reference
        :type ref: str | :class:`Reference`
        """
        if not isinstance(ref, Reference):
            ref = parse_ref(ref)
        try:
            value = self.storage[ref.id].value
            if value is uncomputed:
                raise LookupError("value %s is uncomputed" % (ref,))
            for part in ref.path:
                value = value[part]
        except KeyError:
            if ref.id in self.storage:
                raise LookupError(
                    "cannot dereference '%s' reference with value '%r'" % (
                    ref, self.storage[ref.id].value))
            else:
                raise LookupError("cannot dereference '%s' reference" % (ref,))
        else:
            return value

    def merge(self, st):
        result = self.__class__(self)
        _merge_state_into(result, st)
        return result


class MutableStateGraph(StateGraph, MutableMapping):

    def __setitem__(self, id, st):
        self.storage[id] = st
        self.dependencies[id] = st.dependencies
        self.dependents.setdefault(id, [])

        for d in st.dependencies:
            dependents = self.dependents.setdefault(d.id, [])
            inverse_dep = Dep(id, reset_only=d.reset_only)
            if not inverse_dep in dependents:
                dependents.append(inverse_dep)

    def add(self, *args, **kwargs):
        st = state(*args, **kwargs)
        self[st.id] = st

    def set(self, id, value):
        self[id] = self[id]._replace(value=value)

    def set_many(self, updates):
        for id, value in updates.items():
            self.set(id, value)

    def __delitem__(self, id):
        raise NotImplementedError("not implemented")

    def immutable(self):
        return StateGraph(self)


def _merge_state_into(dst, src):
    for id, st in src.items():
        dst.storage[id] = st
        dst.dependencies[id] = st.dependencies

        for d in st.dependencies:
            dependents = dst.dependents.setdefault(d.id, [])
            inverse_dep = Dep(id, reset_only=d.reset_only)
            if not inverse_dep in dependents:
                dependents.append(inverse_dep)


State = namedtuple(
        'State',
        ['id', 'computator', 'value', 'dependencies', 'rw'])


Dep = namedtuple(
        'Dep',
        ['id', 'reset_only'])


Reset = namedtuple(
        'Reset',
        ['value'])


def dep(id, reset_only=False):
    return Dep(id=id, reset_only=reset_only)


def state(id, computator, dependencies=None, rw=False):
    if dependencies is None:
        dependencies = []
    dependencies = [
        d if isinstance(d, Dep) else Dep(d, reset_only=False)
        for d in dependencies
    ]
    return State(
        id=id,
        computator=computator,
        value=uncomputed,
        dependencies=dependencies,
        rw=rw)


uncomputed = object()


def compute(graph):
    computed = MutableStateGraph()
    visited = set()

    def _compute(state):
        if state.id in visited:
            return

        visited.add(state.id)

        for d in graph.dependencies.get(state.id, []):
            _compute(graph[d.id])

        value = state.computator(state, computed, dirty=None)

        if isinstance(value, Reset):
            value = value.value

        computed[state.id] = state._replace(value=value)

    for state in graph.values():
        _compute(state)

    return computed


def compute_update(graph, origins):
    computed = MutableStateGraph()
    visited = set()

    def _compute(state):
        if state.id in visited:
            return

        force = False

        visited.add(state.id)


        for d in graph.dependencies.get(state.id, []):
            _compute(graph[d.id])

        print "-- computing update", state.id

        value = state.computator(state, computed, dirty=visited)

        if isinstance(value, Reset):
            value = value.value
            force = True

        print "-- computed  update", state.id, force

        computed[state.id] = state._replace(value=value)

        for d in graph.dependents.get(state.id, []):
            if (force and d.id in origins) or not d.reset_only:
                _compute(graph[d.id])

    print origins
    print topo_sort(graph, origins)

    for id in topo_sort(graph, origins):
        _compute(graph[id])

    return computed, visited


def topo_sort(graph, ids):
    sorted = []
    seen = set()

    queue = [s for s in graph.values() if not s.dependencies]

    while queue:

        c = queue.pop()

        if c.id in seen:
            continue

        dependencies = [graph[d.id]
                for d in c.dependencies
                if d.id not in seen]


        if dependencies:
            queue = [c] + dependencies + queue
            continue

        seen.add(c.id)

        if c.id in ids:
            sorted.append(c.id)

        dependents = [graph[d.id]
                for d in graph.dependents.get(c.id, [])
                if d.id not in seen]

        if dependents:
            queue = dependents + queue


    return sorted
