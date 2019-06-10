"""

    rex.graphql.desc
    ================

    API for configuring GraphQL schemas.

    :copyright: 2019-present Prometheus Research, LLC

"""

import inspect
import abc
import functools

from rex.core import Error, cached

from . import code_location


autoloc = object()


class Desc:
    """ Base class for configuration language."""


class Type(Desc):
    """ Base class for schema types."""


class Field(Desc):
    """ Base class for schema fields."""


class ObjectLike(Type):
    def __init__(self, name, fields, description=None, loc=autoloc):
        if not callable(fields):
            raise Error("Argument 'fields' should be a function")

        self.loc = code_location.here() if loc is autoloc else loc
        self.name = name
        self._fields = fields
        self.description = description

    @property
    def fields(self):
        if callable(self._fields):
            seal(self)
        return self._fields

    def add_field(self, name, field):
        """ Add new field."""
        assert isinstance(field, Field)
        self.fields[name] = field


class Object(ObjectLike):
    """ Object type.

    Values of object types are produced by computed fields. The root type is
    also an object type.
    """


class Record(ObjectLike):
    """ Record type corresponds to a database query.

    Values of a record type are queried from database using query fields. If the
    result of a query is a row from a table it is more convenient to use
    :class:Entity type instead.
    """


class Entity(Record):
    """ Entity type corresponds to a table.

    Values of an entity type are queried from database using query fields.
    """


class Compute(Field):
    """ Compute value."""

    def __init__(
        self,
        type,
        f=None,
        args=None,
        description=None,
        deprecation_reason=None,
        loc=autoloc,
    ):
        if f is None:
            f = lambda parent, info, args: getattr(
                parent, info.field_name, None
            )

        args_by_name = {}
        if args is None:
            args = []
        for arg in args:
            args_by_name[arg.name] = arg

        self.loc = code_location.here() if loc is autoloc else loc
        self.type = type
        self.resolver = f
        self.args = args_by_name
        self.description = description
        self.deprecation_reason = deprecation_reason


class Query(Field):
    """ Query values from database."""

    def __init__(
        self,
        query,
        type=None,
        filters=None,
        description=None,
        deprecation_reason=None,
        paginate=False,
        loc=autoloc,
    ):
        from .query import lift, Query

        # init args first so we can use self._collect_arg further
        self.args = {}

        query = lift(query)
        if query.args:
            for arg in query.args.values():
                # As query argument value needs to be always available
                # (otherwise we can't construct the query) we mark it as
                # non-null in case it doesn't have default value specified.
                if not isinstance(arg.type, NonNull):
                    if arg.default_value is None:
                        arg = arg.with_type(NonNull(arg.type))
                self._collect_arg(arg)

        if paginate:
            self._collect_arg(
                argument(
                    name="offset",
                    type=scalar.Int,
                    default_value=0,
                    description="Fetch skipping this number of items",
                )
            )
            self._collect_arg(
                argument(
                    name="limit",
                    type=scalar.Int,
                    default_value=20,
                    description="Fetch only this number of items",
                )
            )

        self.filters = []
        if filters is not None:
            for filter in filters:
                self.add_filter(filter)

        self.loc = code_location.here() if loc is autoloc else loc
        self.query = query
        self.type = type
        self.description = description
        self.deprecation_reason = deprecation_reason
        self.paginate = paginate

    def _collect_arg(self, arg):
        assert isinstance(arg, argument)
        if arg.name in self.args:
            if self.args[arg.name] != arg:
                # TODO: more info here
                raise Error("Inconsistent argument configuration:", arg.name)
        else:
            self.args[arg.name] = arg

    def add_filter(self, filter):
        from .query import Query

        if not isinstance(filter, Filter):
            if isinstance(filter, Query):
                filter = FilterOfQuery(query=filter)
            elif callable(filter):
                filter = filter_from_function(filter)
            else:
                raise Error("Invalid filter:", filter)

        for arg in filter.args.values():
            self._collect_arg(arg)

        self.filters.append(filter)


class Scalar(Type):
    def __init__(self, name, loc=autoloc):
        self.name = name
        self.loc = code_location.here() if loc is autoloc else loc


class ScalarTypeFactory:
    def __getattr__(self, name):
        return Scalar(name=name, loc=None)


scalar = ScalarTypeFactory()


class Enum(Type):
    def __init__(self, name, values, description=None, loc=autoloc):
        loc = code_location.here() if loc is autoloc else loc
        desc = f"While configuring enum '{name}':"
        with code_location.context(loc, desc=desc):
            # Do basic validation for enum value uniqueness.
            seen = {}
            for v in values:
                desc = f"While configuring enum value:"
                with code_location.context(v.loc, desc=desc):
                    prev = seen.get(v.name)
                    if prev:
                        raise Error(
                            "Enum value with the same name is already defined:",
                            prev.loc,
                        )
                    seen[v.name] = v

        self.loc = loc
        self.name = name
        self.values = values
        self.description = description


class EnumValue:
    def __init__(
        self, name, description=None, deprecation_reason=None, loc=autoloc
    ):
        self.loc = code_location.here() if loc is autoloc else loc
        self.name = name
        self.description = description
        self.deprecation_reason = deprecation_reason


class List(Type):
    def __init__(self, type):
        self.type = type


class NonNull(Type):
    def __init__(self, type):
        self.type = type


class Argument(Desc):
    def __init__(
        self,
        name,
        type,
        default_value=None,
        description=None,
        out_name=None,
        loc=autoloc,
    ):
        self.loc = code_location.here() if loc is autoloc else loc
        self.name = name
        self.type = type
        self.default_value = default_value
        self.description = description
        self.out_name = out_name

    def with_type(self, type):
        return self.__class__(
            name=self.name,
            type=type,
            default_value=self.default_value,
            description=self.description,
            out_name=self.out_name,
            loc=self.loc,
        )

    def __eq__(self, o):
        assert isinstance(o, argument), f"Expected argument but got: {o!r}"
        return (
            self.type == o.type
            and self.name == o.name
            and self.default_value == o.default_value
            and self.description == o.description
            and self.out_name == o.out_name
        )


class Filter(abc.ABC):
    @abc.abstractproperty
    def args(self):
        """ Arguments which filter accepts."""

    @abc.abstractmethod
    def apply(self, query, values):
        """ Apply filter to query."""


class FilterOfFunction(Filter):
    def __init__(self, args, f):
        self._args = args
        self.f = f

    @property
    def args(self):
        return self._args

    def apply(self, query, values):
        kwargs = {}
        for name in self.args:
            # skip filter if some args are not defined
            if not name in values:
                return query
            kwargs[name] = values[name]
        for clause in self.f(**kwargs):
            query = query.filter(clause)
        return query


class FilterOfQuery(Filter):
    def __init__(self, query):
        self.query = query

    @property
    def args(self):
        return self.query.args

    def apply(self, query, values):
        for name in self.args:
            # skip filter if some args are not defined
            if not name in values:
                return query
        return query.filter(self.query)


def extract_args(f, mark_as_nonnull_if_no_default_value=False):
    sig = inspect.signature(f)
    args = {}
    require_self_arg = False
    for param in sig.parameters.values():
        name = param.name
        if name == "self":
            require_self_arg = True
            continue
        if isinstance(param.annotation, argument):
            args[name] = param.annotation
        else:
            if not isinstance(param.annotation, Type):
                raise Error(
                    f"Annotation for argument {name} should be GraphQL type"
                )
            type = param.annotation
            default_value = None
            if param.default is not inspect._empty:
                default_value = param.default
            else:
                if mark_as_nonnull_if_no_default_value:
                    type = NonNull(type)
            args[name] = argument(
                name=name, type=type, default_value=default_value
            )

    return_type = None
    if sig.return_annotation is not inspect._empty:
        return_type = sig.return_annotation

    return args, require_self_arg, return_type


def filter_from_function(f):
    args, _, _ = extract_args(f)
    return FilterOfFunction(args=args, f=f)


def compute_from_function(**config):
    def decorate(f):
        args, require_self_arg, return_type = extract_args(
            f, mark_as_nonnull_if_no_default_value=True
        )

        if return_type is None:
            raise Error("Missing return annotation:", "def f(..) -> TYPE:")

        def run(parent, info, values):
            kwargs = {}
            for name in args:
                kwargs[name] = values[name]
            if require_self_arg:
                kwargs["self"] = parent
            return f(**kwargs)

        return compute(args=args.values(), f=run, type=return_type, **config)

    return decorate


def connectiontype_name(entitytype):
    return f"{entitytype.name}_connection"


def connectiontype_uncached(entitytype, filters=None):
    from .query import q

    by_id = q.id.text() == argument("id", NonNull(scalar.ID))
    return Record(
        name=connectiontype_name(entitytype),
        fields=lambda: {
            "get": query(
                q.entity.filter(by_id).first(),
                type=entitytype,
                description=f"Get {entitytype.name} by id",
                loc=None,
            ),
            "all": query(
                q.entity,
                type=entitytype,
                filters=filters,
                description=f"Get all {entitytype.name} items",
                loc=None,
            ),
            "paginated": query(
                q.entity,
                type=entitytype,
                filters=filters,
                paginate=True,
                description=f"Get all {entitytype.name} items (paginated)",
                loc=None,
            ),
            "count": query(
                q.entity.count(),
                description=f"Get the number of {entitytype.name} items",
                loc=None,
            ),
        },
        loc=None,
    )


connectiontype = cached(connectiontype_uncached)


def connect(type, query=None, filters=None, loc=autoloc):
    from .query import q

    loc = code_location.here() if loc is autoloc else loc
    if query is None:
        query = q.navigate(type.name)
    return Query(
        query=q.define(entity=query),
        type=connectiontype(type),
        description=f"Connection to {type.name}",
        loc=loc,
    )


query = Query
compute = Compute
argument = Argument


@functools.singledispatch
def seal(descriptor):
    assert False, f"Do not know how to seal {descriptor!r}"


@seal.register(Object)
@seal.register(Record)
@seal.register(Entity)
def _(descriptor):
    if callable(descriptor._fields):
        descriptor._fields = descriptor._fields()
        for v in descriptor._fields.values():
            seal(v)


@seal.register(List)
@seal.register(NonNull)
def _(descriptor):
    seal(descriptor.type)


@seal.register(Enum)
@seal.register(Scalar)
def _(descriptor):
    pass


@seal.register(Compute)
@seal.register(Query)
def _(descriptor):
    if descriptor.type is not None:
        seal(descriptor.type)
