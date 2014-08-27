"""

    rex.widget.state.fields
    =======================

    :copyright: 2014, Prometheus Research, LLC

"""

from collections import namedtuple
from rex.core import Validate, Error, MaybeVal, MapVal, OneOfVal, StrVal, IntVal
from .computator import (
        CollectionComputator, EntityComputator, PaginatedCollectionComputator,
        InitialValue)
from .graph import State, Dep, Reference, unknown


class StateDescriptor(object):
    """ Abstract base class for fields which can generate state."""

    def describe_state(self, widget, field_name):
        """ Describe state.

        This method should be implemented by subclasses.

        :param widget: widget instance
        :param field_name: field name

        :return: lisf of state descriptors
        :rtype: [(str, :class:`StateDescriptor`)]
        """
        raise NotImplementedError(
            "%s.describe_state(name) is not implemented" % self.__class__.__name__)


class SimpleStateDescriptor(StateDescriptor):

    def __init__(self, dependencies=None, **params):
        self.dependencies = dependencies or []
        self.params = params

    def describe_state(self, widget, field_name):
        state_id = "%s/%s" % (widget.id, field_name)
        dependencies = (self.dependencies(widget)
                        if hasattr(self.dependencies, '__call__')
                        else self.dependencies)
        dependencies = [Dep(d).absolutize(widget.id) for d in dependencies]
        st = State(
                state_id,
                widget=widget,
                dependencies=list(dependencies),
                **self.params)

        return [(field_name, st)]


class DataDescriptor(StateDescriptor):
    """ Field which defines remote data source such as port or HTSQL query.

    :param computator_factory: factory for state computator
    :param url: URL
    :param refs: a mapping of references
    :keywords include_meta: should the result include metadata
    """

    def __init__(self, computator_factory, url, refs=None, include_meta=False,
            defer=None):
        self.computator_factory = computator_factory
        self.url = url
        self.refs = refs
        self.include_meta = include_meta
        self.defer = defer

    def describe_state(self, widget, field_name):
        state_id = "%s/%s" % (widget.id, field_name)
        computator = self.computator_factory(self.url, self.refs, self.include_meta)
        dependencies = [r.id for refs in self.refs.values() for r in refs]
        st = State(state_id,
                widget=widget,
                computator=computator,
                dependencies=dependencies,
                is_writable=False,
                defer=self.defer)
        return [(field_name, st)]


class PaginatedCollectionDescriptor(DataDescriptor):
    """ A reference to a collection which provides pagination mechanism."""

    def describe_state(self, widget, field_name):
        state_id = "%s/%s" % (widget.id, field_name)
        pagination_state_id = "%s/%s/pagination" % (widget.id, field_name)
        sort_state_id = "%s/%s/sort" % (widget.id, field_name)

        dependencies = [r.id for refs in self.refs.values() for r in refs]

        refs = dict(self.refs)
        refs.update({
            "top": (Reference("%s:top" % pagination_state_id),),
            "skip": (Reference("%s:skip" % pagination_state_id),),
            "sort": (Reference("%s" % sort_state_id),),
        }),

        return [
            (field_name,
                State(
                    state_id,
                    widget=widget,
                    computator=PaginatedCollectionComputator(
                        pagination_state_id,
                        self.url,
                        refs=refs,
                        include_meta=self.include_meta),
                    dependencies=dependencies + [
                        pagination_state_id,
                        sort_state_id],
                    is_writable=False,
                    defer=self.defer)),
            ("%sPagination" % field_name,
                State(
                    pagination_state_id,
                    widget=widget,
                    computator=InitialValue({"top": 100, "skip": 0}, reset_on_changes=True),
                    validator=MapVal(StrVal, IntVal),
                    dependencies=dependencies + [sort_state_id],
                    persistence=State.INVISIBLE,
                    is_writable=True)),
            ("%sSort" % field_name,
                State(
                    sort_state_id,
                    widget=widget,
                    validator=StrVal(),
                    dependencies=dependencies,
                    is_writable=True)),
        ]


class StateVal(Validate):

    def __init__(self, validator, **params):
        if isinstance(validator, type):
            validator = validator()
        self.validator = validator
        self.params = params

    def descriptor(self, value):
        return SimpleStateDescriptor(
            validator=self.validator,
            value=value,
            **self.params)

    def __call__(self, value):
        return self.descriptor(self.validator(value))


class DataVal(Validate):

    field_factory = DataDescriptor
    computator_factory = NotImplemented

    def __init__(self, include_meta=False, computator_factory=None):
        self.include_meta = include_meta

        if computator_factory is not None:
            self.computator_factory = computator_factory

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
            refs = {name: (Reference(ref),)
                          if not isinstance(ref, list)
                          else tuple(Reference(r) for r in ref)
                    for name, ref
                    in data.get("refs", {}).items()}
            return self.field_factory(
                    self.computator_factory,
                    data["url"],
                    refs=refs,
                    include_meta=self.include_meta,
                    defer=data.get('defer'))
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
