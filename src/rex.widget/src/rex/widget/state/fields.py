"""

    rex.widget.state.fields
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
from rex.core import Validate, Error
from .computator import (
        CollectionComputator, EntityComputator, PaginatedCollectionComputator,
        InitialValue)
from .graph import parse_ref, StateDescriptor


class StateField(object):
    """ Abstract base class for fields which can generate state."""

    def describe_state(self, widget_id, field_name):
        """ Describe state.

        This method should be implemented by subclasses.

        :param widget_id: widget identifier
        :param field_name: field name
        
        :return: lisf of state descriptors
        :rtype: [(str, :class:`StateDescriptor`)]
        """
        raise NotImplementedError(
            "%s.describe_state(name) is not implemented" % self.__class__.__name__)


class Data(StateField):
    """ Field which defines remote data source such as port or HTSQL query.
    
    :param computator_factory: factory for state computator
    :param url: URL
    :param refs: a mapping of references
    :keywords include_meta: should the result include metadata
    """

    def __init__(self, computator_factory, url, refs=None, include_meta=False):
        self.computator_factory = computator_factory
        self.url = url
        self.refs = refs
        self.include_meta = include_meta

    def describe_state(self, widget_id, field_name):
        state_id = "%s.%s" % (widget_id, field_name)
        computator = self.computator_factory(self.url, self.refs, self.include_meta)
        dependencies = [r.id for r in self.refs.values()]
        state = StateDescriptor(state_id, computator, dependencies, rw=False)
        return [(field_name, state)]


class PaginatedCollection(Data):
    """ A reference to a collection which provides pagination mechanism."""

    def describe_state(self, widget_id, field_name):
        state_id = "%s.%s" % (widget_id, field_name)
        pagination_state_id = "%s.%s.pagination" % (widget_id, field_name)

        dependencies = [r.id for r in self.refs.values()]

        refs = dict(self.refs)
        refs.update({
            "top": "%s:top" % pagination_state_id,
            "skip": "%s:skip" % pagination_state_id,
        }),

        return [
            (field_name,
                StateDescriptor(
                    state_id,
                    PaginatedCollectionComputator(
                        pagination_state_id,
                        self.url,
                        refs=refs,
                        include_meta=self.include_meta),
                    dependencies=dependencies + [pagination_state_id],
                    rw=False)),
            ("%sPagination" % field_name,
                StateDescriptor(
                    pagination_state_id,
                    InitialValue(
                        {"top": 100, "skip": 0},
                        dependencies=dependencies),
                    dependencies=dependencies,
                    rw=True)),
        ]


class State(StateField):

    def __init__(self, initial):
        self.initial = initial

    def describe_state(self, widget_id, field_name):
        state_id = "%s.%s" % (widget_id, field_name)
        return [
            (field_name,
                StateDescriptor(
                    state_id, self.initial,
                    dependencies=[], rw=True))
        ]


class DataVal(Validate):

    field_factory = Data

    def __init__(self, include_meta=False):
        self.include_meta = include_meta

    def __call__(self, data):
        if isinstance(data, basestring):
            return self.field_factory(
                    self.computator_factory,
                    data,
                    refs={},
                    include_meta=self.include_meta)
        elif isinstance(data, dict):
            if not "url" in data:
                raise Error(
                    "invalid data reference: expected an URL or "
                    "{url: ..., refs: ...} mapping")
            refs = {name: parse_ref(ref)
                    for name, ref
                    in data.get("refs", {}).items()}
            return self.field_factory(
                    self.computator_factory,
                    data["url"],
                    refs=refs,
                    include_meta=self.include_meta)
        else:
            raise Error(
                "invalid data reference: expected an URL or "
                "{url: ..., refs: ...} mapping")


class CollectionVal(DataVal):

    computator_factory = CollectionComputator


class PaginatedCollectionVal(DataVal):

    field_factory = PaginatedCollection
    computator_factory = PaginatedCollectionComputator


class EntityVal(DataVal):

    computator_factory = EntityComputator


class StateVal(Validate):

    def __init__(self, validate):
        if isinstance(validate, type):
            validate = validate()
        self.validate = validate

    def __call__(self, data):
        return State(self.validate(data))

