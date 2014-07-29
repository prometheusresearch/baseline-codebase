"""

    rex.widget.state.fields
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
from rex.core import Validate, Error, RecordField
from .computator import (
        CollectionComputator, EntityComputator, PaginatedCollectionComputator,
        InitialValue)
from .graph import state
from .reference import parse_ref


class StateDescriptor(object):
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


class SimpleStateDescriptor(StateDescriptor):

    def __init__(self, value, computator=None, validator=None, dependencies=None):
        self.value = value
        self.computator = computator
        self.dependencies = dependencies
        self.validator = validator


    def describe_state(self, widget_id, field_name):
        state_id = "%s.%s" % (widget_id, field_name)
        dependencies = ["%s.%s" % (widget_id, dep) for dep in self.dependencies]
        st = state(
                state_id,
                computator=self.computator,
                validator=self.validator,
                dependencies=dependencies,
                rw=True)
        return [(field_name, st)]


class DataDescriptor(StateDescriptor):
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
        st = state(state_id, computator, dependencies=dependencies)
        return [(field_name, st)]


class PaginatedCollectionDescriptor(DataDescriptor):
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
                state(
                    state_id,
                    PaginatedCollectionComputator(
                        pagination_state_id,
                        self.url,
                        refs=refs,
                        include_meta=self.include_meta),
                    dependencies=dependencies + [pagination_state_id])),
            ("%sPagination" % field_name,
                state(
                    pagination_state_id,
                    InitialValue({"top": 100, "skip": 0}, reset_on_changes=True),
                    dependencies=dependencies,
                    rw=True)),
        ]


class StateVal(Validate):

    def __init__(self, validator,
            computator=None,
            dependencies=None,
            default=RecordField.NODEFAULT):

        if isinstance(validator, type):
            validator = validator()

        self.validator = validator
        self.computator = computator or InitialValue(default)
        self.dependencies = dependencies or []
        self.default = self.field(default)

    def field(self, value):
        return SimpleStateDescriptor(value,
                validator=self.validator,
                computator=self.computator,
                dependencies=self.dependencies)

    def __call__(self, data):
        return self.field(self.validator(data))


class DataVal(Validate):

    field_factory = DataDescriptor

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

    field_factory = PaginatedCollectionDescriptor
    computator_factory = PaginatedCollectionComputator


class EntityVal(DataVal):

    computator_factory = EntityComputator
