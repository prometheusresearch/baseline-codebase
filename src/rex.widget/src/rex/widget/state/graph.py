"""

    rex.widget.state.graph
    ======================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple, MutableMapping
from .computator import StateComputator

class StateGraph(MutableMapping):
    """ Represents application state as a graph of interdependent values."""

    def __init__(self, initial=None):
        self.storage = {}
        self.dependents = {}

        if initial is not None:
            self.update(initial)

    def __iter__(self):
        return iter(self.storage)

    def __len__(self):
        return len(self.storage)

    def __getitem__(self, id):
        if ':' in id:
            id = id.split(':', 1)[0]
        return self.storage[id]

    def __setitem__(self, id, state):
        self.storage[id] = state
        for dep in state.dependencies:
            self.dependents.setdefault(dep, []).append(id)

    def __delitem__(self, id):
        del self.storage[id]

    def dependency_path(self, from_id):
        """ Iterate over dependencies originating from ``from_id``."""
        yield self.storage[from_id]
        for state_id in self.dependents.get(from_id, []):
            for dep in self.dependency_path(state_id):
                yield dep

    def deref(self, ref):
        """ Dereference state reference to a value.

        :param ref: state reference
        :type ref: str | :class:`Reference`
        """
        if not isinstance(ref, Reference):
            ref = parse_ref(ref)
        value = self.storage[ref.id].value
        for part in ref.path:
            value = value[part]
        return value


StateDescriptor = namedtuple(
        'StateDescriptor',
        ['id', 'value', 'dependencies', 'rw'])


Reference = namedtuple('Reference', ['id', 'path'])


def compute_state_graph(graph):
    """ Compute ``graph``.

    :param graph: state graph to compute
    :type graph: :class:`StateGraph`

    :return: computed state graph
    :rtype: :class:`StateGraph`
    """

    computed_graph = StateGraph()

    for node in graph.values():
        compute_state_node(node, graph, computed_graph)

    return computed_graph


def compute_state_graph_update(graph, origins):
    """ Compute ``graph`` given the changed atoms listed in ``origins``.

    :param graph: state graph to compute
    :type graph:  :class:`StateGraph`

    :param origins: a list of state ids which were changed
    :type origins: [str]

    :return: computed state graph
    :rtype: :class:`StateGraph`
    """
    # we use context to store fetched state but only need to return state along
    # the dependency path, so the byte size would be minimal
    computed_graph = StateGraph()
    context = StateGraph()

    for origin in origins:
        for node in graph.dependency_path(origin):
            compute_state_node(node, graph, context, origins=origins)
            computed_graph[node.id] = context[node.id]

    return computed_graph


def compute_state_node(node, graph_in, graph_out, origins=None):
    if node.id not in graph_out:
        if isinstance(node.value, StateComputator):
            for dep in node.dependencies:
                compute_state_node(graph_in[dep], graph_in, graph_out)
            value = node.value(graph_out.get(node.id), graph_out, origins=origins)
            graph_out[node.id] = node._replace(value=value)
        else:
            graph_out[node.id] = graph_in[node.id]


def parse_ref(ref):
    """ Parse string into :class:`Reference`"""
    if ':' in ref:
        id, path = ref.split(':', 1)
        return Reference(id, path.split('.'))
    else:
        return Reference(ref, [])
