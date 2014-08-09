"""

    rex.widget.state.graph
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple, MutableMapping, Mapping
from rex.core import AnyVal, Error
from ..logging import getLogger
from .reference import Reference, parse_ref


log = getLogger(__name__)


class StateGraph(Mapping):
    """ Represents immutable graph of states with dependencies between.
    """

    def __init__(self, initial=None):
        self.storage = {}
        self.dependencies = {}
        self.dependents = {}

        if initial is not None:
            _merge_state_into(self, initial)

    def __contains__(self, id):
        return id in self.storage

    def __iter__(self):
        return iter(self.storage)

    def __len__(self):
        return len(self.storage)

    def __getitem__(self, id):
        if ':' in id:
            id = id.split(':', 1)[0]
        return self.storage[id]

    def __str__(self):
        return "%s(storage=%s, dependents=%s)" % (
                self.__class__.__name__, self.storage, self.dependents)

    __repr__ = __str__

    def get_value(self, ref):
        """ Dereference state reference to a value.

        :param ref: state reference
        :type ref: str | :class:`Reference`
        """
        if not isinstance(ref, Reference):
            ref = parse_ref(ref)
        try:
            value = self.storage[ref.id].value
            if value is unknown:
                raise LookupError("value %s is unknown" % (ref,))
            for part in ref.path:
                if value is None:
                    return None
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
    """ A mutable version of state graph.
    """

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


class StateGraphComputation(Mapping):
    """ Computation over state graph.

    :attr input: input state graph
    :keyword output: resulted graph with computed state
    :keyword dirty: a set of dirtied state ids
    :keyword user: user
    """

    def __init__(self, input, output=None, dirty=None, user=None):
        self.input = input
        self.output = output or MutableStateGraph()
        self.dirty = set() if not dirty else set(dirty)
        self.user = user

        if self.user is not None:
            self.output['USER'] = state('USER', None, None, value=self.user)

    def __iter__(self):
        return iter(self.output)

    def __len__(self):
        return len(self.output)

    def compute(self, id):
        reset = False
        st = self.input[id]
        log.debug('computing: %s', id)
        is_active = st.is_active(self)
        from .computator import DataComputator
        value = st.computator(st.widget, st, self, dirty=self.dirty, is_active=is_active)
        if isinstance(value, Reset):
            value = value.value
            reset = True
        if st.value != value:
            self.dirty.add(id)
        log.debug('computed:  %s, reset status: %s', id, reset)
        self.output[st.id] = st._replace(value=value)
        return reset

    def is_computed(self, id):
        return id in self.output and self.output[id].value is not unknown

    def get_output(self, dirty_only=False):
        if dirty_only:
            return StateGraph({
                id: state for id, state
                in self.output.items()
                if id in self.dirty
            })
        else:
            return self.output.immutable()

    def __getitem__(self, ref):
        if not isinstance(ref, Reference):
            ref = parse_ref(ref)

        if self.is_computed(ref.id):
            return self.output.get_value(ref)

        if not ref.id in self.input:
            raise Error('invalid reference: %s' % (ref,))

        self.compute(ref.id)

        return self.output.get_value(ref)


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
        ['id', 'widget', 'computator', 'validator', 'is_active',
         'value', 'dependencies', 'rw'])


Dep = namedtuple(
        'Dep',
        ['id', 'reset_only'])


Reset = namedtuple(
        'Reset',
        ['value'])


# a marker for value which are unknown
unknown = object()


def dep(id, reset_only=False):
    return Dep(id=id, reset_only=reset_only)


def state(id, widget, computator, validator=AnyVal, is_active=None, value=unknown, dependencies=None, rw=False):
    if dependencies is None:
        dependencies = []
    dependencies = [
        d if isinstance(d, Dep) else Dep(d, reset_only=False)
        for d in dependencies
    ]
    return State(
        id=id,
        widget=widget,
        computator=computator,
        validator=validator,
        value=value,
        dependencies=dependencies,
        is_active=is_active or (lambda graph: True),
        rw=rw)


def compute(graph, user=None):
    """ Compute entire state graph."""
    computation = StateGraphComputation(graph, user=user)

    for id in computation.input:
        if not computation.is_computed(id):
            computation.compute(id)

    return computation.get_output()


def compute_update(graph, origins, user=None):
    """ Compute state graph update which were originated from ``origins``."""
    computation = StateGraphComputation(graph, dirty=origins, user=user)

    def _compute(id, recompute_deps=True):
        if computation.is_computed(id):
            return

        reset = computation.compute(id)

        if recompute_deps or id in origins:
            for d in computation.input.dependents.get(id, []):
                st = computation.input[d.id]
                if not d.reset_only or reset and (st.id in origins or st.rw):
                    _compute(d.id, recompute_deps=not reset or not d.reset_only)

    for id in cause_effect_sort(computation.input, origins):
        _compute(id)

    return computation.get_output(dirty_only=True)


def cause_effect_sort(graph, ids):
    """ Sort ``ids`` topologically according to ``graph`` to respect
    cause-effect relationship."""
    result = []
    seen = set()

    # start with states which have no deps
    queue = [s for s in graph.values() if not s.dependencies]

    while queue:
        c = queue.pop()
        if c.id in seen:
            continue

        # check if we have deps we didn't see before
        dependencies = [graph[d.id]
                for d in c.dependencies
                if d.id not in seen and d.id in graph]
        if dependencies:
            queue = [c] + dependencies + queue
            continue

        # mark it as seen and append to the result
        seen.add(c.id)
        if c.id in ids:
            result.append(c.id)

        # proceed with states which depend on the current state
        dependents = [graph[d.id]
                for d in graph.dependents.get(c.id, [])
                if d.id not in seen]
        if dependents:
            queue = dependents + queue

    return result
