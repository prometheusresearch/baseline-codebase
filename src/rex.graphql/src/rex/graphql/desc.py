"""

    rex.graphql.desc
    ================

    API for configuring GraphQL schemas.

    :copyright: 2019-present Prometheus Research, LLC

"""

import inspect
import abc
import functools
import typing as t

from rex.core import Error, cached

from . import code_location
from .param import Param
from .query import lift, Query as QueryCombinator, q


autoloc = code_location.autoloc


class Desc:
    pass


class Type(Desc):
    """ A GraphQL Type.

    You can use :class:`Entity`, :class:`Record` or :class:`Object` to create
    new types. Also see :class:`List` and :class:`NonNull` to produce types out
    of existing types.

    The :data:`scalar` namespace represents scalar types, e.g. `scala.String` is
    a string type.
    """


class Field(Desc):
    """ A GraphQL Field.

    You can use :func:`compute` to define fields which compute values at runtime
    or :func:`query` for fields which query data from a database.
    """


FieldsType = t.Callable[[], t.Dict[str, Field]]


class ObjectLike(Type):
    def __init__(
        self,
        name: str,
        fields: FieldsType,
        description: t.Optional[str] = None,
        loc=autoloc,
    ):
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

    def add_field(self, name=None, field=None):
        """ Add new field."""

        def register(field):
            assert isinstance(field, Field), "Expected a field"
            field_name = name
            if field_name is None:
                if not field.name:
                    raise Error("Missing field name")
                field_name = field.name
            self.fields[field_name] = field

        if field is None:

            def decorate(field):
                register(field)
                return field

            return decorate
        else:
            register(field)


class Object(ObjectLike):
    """ Define an object type.

    Values of an object type are produced by :func:`compute` fields. The root
    type of a :func:`schema` is also an object type.

    :param name: Name of the type
    :param fields: Object fields
    """


class Record(ObjectLike):
    """ Define a record type.

    Values of a record type are produced by :func:`query` fields.

    If the result of a query is a row from a table it is more convenient to use
    :class:`Entity` type instead.

    Example::

        >>> stats = Record(
        ...     name="stats",
        ...     fields=lambda: {
        ...         "name": query(q.name),
        ...         "nation_count": query(q.nation_count),
        ...     }
        ... )

    Now we can use it with a :func:`query` field::

        >>> sch = schema(fields=lambda: {
        ...     'regionStats': query(
        ...         q.nation
        ...          .group(name=q.region.name)
        ...          .select(name=q.name, nation_count=q.nation.count()),
        ...         type=stats
        ...     )
        ... })

    :param name: Name of the type
    :param fields: Record fields
    """


class Entity(Record):
    """ Define an entity type.

    Values of an Entity type are produced by :func:`query` fields when the
    corresponding query results in a row of some table. This also automatically
    adds an ``id`` field which returns the value of primary keys for the table.

    Example::

        >>> region = Entity(
        ...     name="region",
        ...     fields=lambda: {
        ...         'name': query(q.name),
        ...         'nation': query(q.nation, type=nation),
        ...     }
        ... )

        >>> nation = Entity(
        ...     name="nation",
        ...     fields=lambda: {
        ...         'name': query(q.name),
        ...         'region': query(q.region, type=region),
        ...     }
        ... )

    Note how using ``lambda: ...`` for fields allows us to define mutually
    recursive type definitions. Now we can construct a schema::

        >>> sch = schema(fields=lambda: {
        ...     'region': query(q.region, type=region),
        ...     'nation': query(q.nation, type=nation),
        ... })

    :param name: Name of the type
    :param fields: Entity fields
    """


class InputObject(Type):
    """ InputObject type.

    An object which is used as an input value (passed via argument).
    """

    def __init__(
        self,
        name: str,
        fields: FieldsType,
        parse=None,
        description=None,
        loc=autoloc,
    ):
        if not callable(fields):
            raise Error("Argument 'fields' should be a function")

        self.loc = code_location.here() if loc is autoloc else loc
        self.name = name
        self.description = description
        self.parse = parse
        self._fields = fields

    @property
    def fields(self):
        if callable(self._fields):
            seal(self)
        return self._fields


class InputObjectField:
    def __init__(
        self,
        type,
        default_value=None,
        out_name=None,
        description=None,
        loc=autoloc,
    ):
        self.type = type
        self.default_value = default_value
        self.out_name = out_name
        self.description = description
        self.loc = code_location.here() if loc is autoloc else loc


class Compute(Field):
    def __init__(
        self,
        type,
        f=None,
        params=None,
        name=None,
        description=None,
        deprecation_reason=None,
        loc=autoloc,
    ):
        if f is None:
            f = lambda parent, info, params: getattr(
                parent, info.field_name, None
            )

        if params is None:
            params = []

        self.loc = code_location.here() if loc is autoloc else loc
        self.type = type
        self.resolver = f
        self.params = {param.name: param for param in params}
        self.name = name
        self.description = description
        self.deprecation_reason = deprecation_reason


class Query(Field):
    def __init__(
        self,
        query,
        type=None,
        filters=None,
        name=None,
        description=None,
        deprecation_reason=None,
        sort=None,
        paginate=False,
        loc=autoloc,
    ):

        # init params first so we can use self._add_param further
        self.params = {}

        query = lift(query)
        if query.params:
            for param in query.params.values():
                # As query argument value needs to be always available
                # (otherwise we can't construct the query) we mark it as
                # non-null in case it doesn't have default value specified.
                if (
                    isinstance(param, Argument)
                    and not isinstance(param.type, NonNull)
                    and param.default_value is None
                ):
                    param = param.with_type(NonNull(param.type))
                self._add_param(param)

        if paginate:
            self._add_param(
                argument(
                    name="offset",
                    type=scalar.Int,
                    default_value=0,
                    description="Fetch skipping this number of items",
                )
            )
            self._add_param(
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
        self.name = name
        self.description = description
        self.deprecation_reason = deprecation_reason
        self.paginate = paginate
        if sort is not None and not isinstance(sort, (tuple, list)):
            sort = [sort]
        self.sort = sort or []

    def _add_param(self, param):
        assert isinstance(param, Param)
        if param.name in self.params:
            if self.params[param.name] != param:
                raise Error("Inconsistent argument configuration:", param.name)
        else:
            self.params[param.name] = param

    def set_sort(self, *sort):
        """ Apply sorting for this field.

        Consider you have a query field::

            >>> regions = query(q.region, type=region)

        Now you can add sorting::

            >>> regions.set_sort(q.name, q.comment.desc())

        """
        if len(sort) == 1 and sort[0] is None:
            self.sort = None
        else:
            self.sort = sort

    def add_filter(self, filter=None):
        """ Add new filter.

        Consider you have a query field::

            >>> regions = query(q.region, type=region)

        Now we can add new filters via queries::

            >>> regions.add_filter(q.name == argument('name', scalar.String))

        Or we can chain it with :func:`filter_from_function` as a decorator::

            >>> @regions.add_filter()
            ... @filter_from_function()
            ... def by_comment(comment: scalar.Int):
            ...     yield q.comment == comment

        """

        def register(filter):
            if not isinstance(filter, Filter):
                if isinstance(filter, QueryCombinator):
                    filter = FilterOfQuery(query=filter)
                elif callable(filter):
                    filter = filter_from_function(filter)
                else:
                    raise Error("Invalid filter:", filter)

            for param in filter.params.values():
                self._add_param(param)

            self.filters.append(filter)

        if filter is None:

            def decorate(filter):
                register(filter)
                return filter

            return decorate
        else:
            register(filter)


class Scalar(Type):
    def __init__(self, name, loc=autoloc):
        self.name = name
        self.loc = code_location.here() if loc is autoloc else loc


class ScalarTypeFactory:
    def __getattr__(self, name):
        return Scalar(name=name, loc=None)


#: Namespace to describe GraphQL scalar types by its name.
#:
#: Example::
#:
#:   String = scalar.String
#:   Int = scalar.Int
#:
scalar = ScalarTypeFactory()


class EntityId(Type):
    def __init__(self, table_name, loc=autoloc):
        self.name = f"{table_name}_id"
        self.table_name = table_name
        self.loc = code_location.here() if loc is autoloc else loc


class EntityIdTypeFactory:
    def __getattr__(self, table_name):
        return EntityId(table_name=table_name, loc=None)


#: Namespace to describe entity id types.
#:
#: Example::
#:
#:   region_id = entity_id.region
#:   nation_id = entity_id.nation
#:
entity_id = EntityIdTypeFactory()


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
    """ Define a list type for a specified type.

    Use when field results in a list of items of a specified type::

        >>> field = compute(List(scalar.String))

    """

    def __init__(self, type):
        self.type = type


class NonNull(Type):
    """ Define a non-null type for a specified type.

    Use when field results in a value which should not be ``None``::

        >>> field = compute(NonNull(scalar.String))

    """

    def __init__(self, type):
        self.type = type


class Filter(abc.ABC):
    @abc.abstractproperty
    def params(self):
        """ Arguments which filter accepts."""

    @abc.abstractmethod
    def apply(self, query, values):
        """ Apply filter to query."""


class FilterOfFunction(Filter):
    def __init__(self, params, f):
        self._params = params
        self.f = f

    @property
    def params(self):
        return self._params

    def apply(self, query, values):
        kwargs = {}
        for name in self.params:
            # skip filter if some params are not defined
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
    def params(self):
        return self.query.params

    def apply(self, query, values):
        for name in self.params:
            # skip filter if some params are not defined
            if not name in values:
                return query
        return query.filter(self.query)


def extract_params(f, mark_as_nonnull_if_no_default_value=False):
    sig = inspect.signature(f)
    params = {}
    for param in sig.parameters.values():
        name = param.name
        if isinstance(param.annotation, Param):
            params[name] = param.annotation
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
            params[name] = argument(
                name=name, type=type, default_value=default_value
            )

    return_type = None
    if sig.return_annotation is not inspect._empty:
        return_type = sig.return_annotation

    return params, return_type


def filter_from_function():
    """ Decorator which allows to define a filter from a function.

    The signature of a function is used to infer arguments and their types.

    Example::

        >>> @filter_from_function()
        ... def by_name(name: scalar.String):
        ...     yield q.name == name

    Now we can pass the filter to :func:`query` field::

        >>> sch = schema(fields=lambda: {
        ...     'region': query(q.region, type=region, filters=[by_name])
        ... })

    Note how ``name`` argument is configured for the ``region`` field::

        >>> data = execute(sch, '''
        ... {
        ...     region(name: "AFRICA") { name }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']]
        ['AFRICA']

    .. note::
        Filters defined using :func:`filter_from_function` are not being
        typechecked against database schema and therefore it is advised not to
        use it unless absolutely neccessary. Prefer to use filters-as-queries.

    """

    def decorate(f):
        params, _ = extract_params(f)
        return FilterOfFunction(params=params, f=f)

    return decorate


def compute_from_function(
    name=None, description=None, deprecation_reason=None, loc=autoloc
) -> Field:
    """ Decorator which allows to define a :func:`compute` field from a
    function.

    Annotations are used to define arguments and return type. If an argument has
    no default value then the type will be automatically marked as
    :class:`NonNull`.

    Example::

        >>> @compute_from_function()
        ... def add_numbers(x: scalar.Int, y: scalar.Int) -> scalar.Int:
        ...     return x + y

        >>> sch = schema(fields=lambda: {'add': add_numbers})
        >>> data = execute(sch, '{ four: add(x: 2, y: 2) }')
        >>> data.data['four']
        4

    :param description: Description
    :param deprecation_reason: Reason for deprecation
    """
    loc = code_location.here() if loc is autoloc else loc

    def decorate(f):
        field_name = name
        if field_name is None:
            field_name = f.__name__

        params, return_type = extract_params(
            f, mark_as_nonnull_if_no_default_value=True
        )

        if return_type is None:
            raise Error("Missing return annotation:", "def f(..) -> TYPE:")

        def run(parent, info, values):
            kwargs = {}
            for name in params:
                if name in values:
                    kwargs[name] = values[name]
            return f(**kwargs)

        return compute(
            params=params.values(),
            f=run,
            type=return_type,
            deprecation_reason=deprecation_reason,
            name=field_name,
            description=description,
        )

    return decorate


def connectiontype_name(entitytype):
    return f"{entitytype.name}_connection"


def connectiontype_uncached(entitytype, filters=None):

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


def connect(
    type: Entity,
    query: QueryCombinator = None,
    filters: t.List[Filter] = None,
    loc=autoloc,
):
    """ Configure a :func:`query` field for querying tables or one-to-many
    links between tables.

    This generates a new :func:`Record` type with fields: ``get`` to query for a
    single row by id, ``all`` - all rows, ``paginated`` - all rows paginated and
    ``count`` - count all rows in a table.

    Example::

        >>> sch = schema(fields=lambda: {
        ...     'region': connect(region, query=q.region)
        ... })

    Getting a row by id::

        >>> data = execute(sch, '''
        ... {
        ...     region {
        ...         africa: get(id: "AFRICA") { name }
        ...     }
        ... }
        ... ''')
        >>> data.data["region"]["africa"]["name"]
        'AFRICA'

    Getting all rows::

        >>> data = execute(sch, '''
        ... {
        ...     region {
        ...         all { name }
        ...     }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']['all']]
        ['AFRICA', 'AMERICA', 'ASIA', 'EUROPE', 'MIDDLE EAST']

    Getting all rows by page::

        >>> data = execute(sch, '''
        ... {
        ...     region {
        ...         paginated(limit: 2) { name }
        ...     }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']['paginated']]
        ['AFRICA', 'AMERICA']

    Count all rows::

        >>> data = execute(sch, '''
        ... {
        ...     region {
        ...         count
        ...     }
        ... }
        ... ''')
        >>> data.data["region"]["count"]
        5

    :param type: Entity type configure connect field for
    :param query:
        Query, if ``None`` is passed then the name of the entity type is used
    :param filters: List of filters to add to ``all`` and ``paginated`` fields.
    """

    loc = code_location.here() if loc is autoloc else loc
    if query is None:
        query = q.navigate(type.name)
    return Query(
        query=q.define(entity=query),
        type=connectiontype(type),
        description=f"Connection to {type.name}",
        loc=loc,
    )


class Argument(Param):
    """ Param passed an GraphQL argument."""

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
        return (
            self.__class__ == o.__class__
            and self.name == o.name
            and self.type == o.type
            and self.default_value == o.default_value
            and self.out_name == o.out_name
        )


class ComputedParam(Param):
    """ Param computed at runtime."""

    def __init__(self, name, type, f):
        self.name = name
        self.type = type
        self.compute = f

    def with_type(self, type):
        return self.__class__(name=self.name, type=type, f=self.compute)

    def __eq__(self, o):
        return (
            self.__class__ == o.__class__
            and self.name == o.name
            and self.type == o.type
            and self.compute == o.compute
        )


def query(
    query: QueryCombinator,
    type: Type = None,
    filters: t.List[t.Union[QueryCombinator, Filter]] = None,
    name: t.Optional[str] = None,
    description: t.Optional[str] = None,
    deprecation_reason: t.Optional[str] = None,
    sort: t.Optional[QueryCombinator] = None,
    paginate: bool = False,
    loc=autoloc,
) -> Field:
    """
    Define a field which queries data from a database.

    Example::

        >>> sch = schema(fields=lambda: {
        ...     'regionCount': query(q.region.count())
        ... })

        >>> data = execute(sch, '''
        ... {
        ...     regionCount
        ... }
        ... ''')
        >>> data.data['regionCount']
        5

    In case query results in a scalar value (like the example above) rex.graphql
    can infer result type automatically. Oherwise you need to specify it (the
    type should be described by :class:`Entity` or :class:`Record`)::

        >>> sch = schema(fields=lambda: {
        ...     'region': query(q.region, type=region)
        ... })

        >>> data = execute(sch, '''
        ... {
        ...     region { name }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']]
        ['AFRICA', 'AMERICA', 'ASIA', 'EUROPE', 'MIDDLE EAST']

    :param query:
    :param type: GraphQL type
    :param filters: A list of filters to apply
    :param name: Name
    :param description: Description
    :param deprecation_reason: Reason for deprecation
    :param paginate: If automatic offset/limit arguments should be added
    """
    loc = code_location.here() if loc is autoloc else loc
    return Query(
        query=query,
        type=type,
        filters=filters,
        name=name,
        description=description,
        deprecation_reason=deprecation_reason,
        sort=sort,
        paginate=paginate,
        loc=loc,
    )


def compute(
    type: Type,
    f=None,
    params: t.Dict[str, Param] = None,
    description: t.Optional[str] = None,
    name: t.Optional[str] = None,
    deprecation_reason: t.Optional[str] = None,
    loc=autoloc,
) -> Field:
    """
    Define a field which computes value at runtime.

    Example::

        >>> class AppSettings:
        ...     title = 'AppTitle'

        >>> settings = Object(
        ...     name='Settings',
        ...     fields=lambda: {
        ...         'title': compute(scalar.String)
        ...     }
        ... )

        >>> sch = schema(fields=lambda: {
        ...     'settings': compute(
        ...         type=settings,
        ...         f=lambda parent, info, args: AppSettings
        ...     )
        ... })

        >>> data = execute(sch, '''
        ... {
        ...     settings { title }
        ... }
        ... ''')
        >>> data.data['settings']
        OrderedDict([('title', 'AppTitle')])

    By default :func:`compute` computes the value as ``getattr(parent, name)``
    but ``f`` argument can be supplied instead.

    :param type: GraphQL type
    :param f: Function used to compute the value of the field
    :param params: Field params
    :param name: Name
    :param description: Description
    :param deprecation_reason: Reason for deprecation
    """
    loc = code_location.here() if loc is autoloc else loc
    return Compute(
        type=type,
        f=f,
        params=params,
        name=name,
        description=description,
        deprecation_reason=deprecation_reason,
        loc=loc,
    )


#: Define a GraphQL argument.
def argument(
    name: str,
    type: Type,
    default_value: t.Any = None,
    description: str = None,
    out_name: str = None,
    loc=autoloc,
) -> Param:
    """ Define a parameter as a GraphQL argument.

    Example usage with :func:`query` fields::

        >>> name = argument(
        ...     name="name",
        ...     type=scalar.String,
        ... )

    Use an argument inside a query::

        >>> sch = schema(
        ...     fields=lambda: {
        ...         'regionByName': query(
        ...             q.region.filter(q.name == name).first(),
        ...             type=region,
        ...         )
        ...     }
        ... )
        >>> data = execute(sch, '''
        ... {
        ...     regionByName(name: "AFRICA") { name }
        ... }
        ... ''')
        >>> data.data['regionByName']['name']
        'AFRICA'

    :param name: Name of the parameter
    :param type: Type of the parameter
    :param default_value:
        Default value which will be used if argument was not
        provided
    :param description: Description of the parameter
    """
    loc = code_location.here() if loc is autoloc else loc
    return Argument(
        name=name,
        type=type,
        default_value=default_value,
        description=description,
        out_name=out_name,
        loc=loc,
    )


#: Define a parameter.
def param(
    name: str, type: t.Optional[Type], f: t.Callable[[t.Any, t.Any], t.Any]
) -> Param:
    """ Define a parameter which computes its value at runtime.

    Example::

        >>> current_region = param(
        ...     name='region',
        ...     type=scalar.String,
        ...     f=lambda parent, context: context['region']
        ... )

    Define a field which references this param::

        >>> sch = schema(
        ...     fields=lambda: {
        ...         'currentRegion': query(
        ...             q.region.filter(q.name == current_region).first(),
        ...             type=region,
        ...         )
        ...     }
        ... )

    Then later supply the corresponding context to :func:`execute`::

        >>> data = execute(sch, '''
        ... {
        ...     currentRegion { name }
        ... }
        ... ''', context={'region': 'AFRICA'})
        >>> data.data['currentRegion']['name']
        'AFRICA'

    :param name: Name of the parameter
    :param type: Type of the parameter
    :param f:
        Function which takes the parent object and context and returns the
        paramer value
    """
    return ComputedParam(name=name, type=type, f=f)


#: Parameter which points to the parent object in GraphQL schema.
#:
#: Note that this can be used only for :func:`compute` fields.
#:
#: Example::
#:
#:   >>> @compute_from_function
#:   ... def get_parent(parent: parent_param):
#:   ...    return parent.name
#:
parent_param = param(name="parent", type=None, f=lambda parent, ctx: parent)


class Mutation(Desc):
    """ A GraphQL Mutation.
    """

    def __init__(self, name, compute):
        self.name = name
        self.compute = compute


def mutation_from_function(
    description=None, deprecation_reason=None, loc=autoloc
):
    make = compute_from_function(
        description=description, deprecation_reason=deprecation_reason, loc=loc
    )

    def decorate(f):
        name = f.__name__
        return Mutation(name=name, compute=make(f))

    return decorate


@functools.singledispatch
def seal(descriptor):
    assert False, f"Do not know how to seal {descriptor!r}"


@seal.register(Object)
@seal.register(Record)
@seal.register(Entity)
@seal.register(InputObject)
def _(descriptor):
    if callable(descriptor._fields):
        descriptor._fields = descriptor._fields()
        for v in descriptor._fields.values():
            seal(v)


@seal.register(InputObjectField)
@seal.register(List)
@seal.register(NonNull)
def _(descriptor):
    seal(descriptor.type)


@seal.register(Enum)
@seal.register(Scalar)
@seal.register(EntityId)
def _(descriptor):
    pass


@seal.register(Compute)
@seal.register(Query)
def _(descriptor):
    if descriptor.type is not None:
        seal(descriptor.type)
