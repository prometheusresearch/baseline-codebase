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
from rex.query.builder import lift, Param, Q, q


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
        finalize_query=None,
        transform=None,
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
                    and param.default_value is no_default_value
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

        if transform is not None and type is None:
            with code_location.context(self.loc):
                raise Error(
                    "Missing type argument for a query field w/ transform"
                )

        self.query = query
        self.type = type
        self.name = name
        self.description = description
        self.deprecation_reason = deprecation_reason
        self.finalize_query = finalize_query
        self.transform = transform
        self.paginate = paginate

        self.sort = None
        if sort is not None:
            if not isinstance(sort, (tuple, list)):
                sort = [sort]
            self.set_sort(*sort)

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
        elif len(sort) == 1 and isinstance(sort[0], Sort):
            sort = sort[0]
            self.sort = sort
            for param in sort.params.values():
                self._add_param(param)
        else:
            for s in sort:
                if not isinstance(s, Q):
                    raise Error("Invalid sort, expected query but got:", s)
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
                if isinstance(filter, Q):
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

    def __getitem__(self, name):
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

    def __getitem__(self, table_name):
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


class Sort(abc.ABC):
    @abc.abstractproperty
    def params(self):
        """ Arguments which filter accepts."""

    @abc.abstractmethod
    def apply(self, query, values):
        """ Apply filter to query."""


class SortOfFunction(Sort):
    def __init__(self, params, f):
        self._params = params
        self.f = f

    @property
    def params(self):
        return self._params

    def apply(self, query, values):
        kwargs = {}
        for name, param in self.params.items():
            # skip sort if some of the params are not defined
            if not param.name in values:
                return query
            kwargs[name] = values[param.name]
        query = query.sort(self.f(**kwargs))
        return query


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
        for name, param in self.params.items():
            if not param.name in values:
                if (
                    isinstance(param, Argument)
                    and param.default_value is not no_default_value
                ):
                    continue
                else:
                    return query
            else:
                kwargs[name] = values[param.name]
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
            default_value = no_default_value
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


def sort_from_function():
    """ Decorator which allows to define a sort from a function.

    The signature of a function is used to infer arguments and their types.

    Example::

        >>> sort_region_by = Enum(
        ...     name='sort_region_by',
        ...     values=[EnumValue('name'), EnumValue('comment')],
        ... )

        >>> @sort_from_function()
        ... def sort_region(
        ...         sort_by: sort_region_by = None,
        ...         desc: scalar.Boolean = False
        ... ):
        ...     sort_q = None
        ...     if sort_by == 'name':
        ...         sort_q = q.name
        ...     elif sort_by == 'comment':
        ...         sort_q = q.comment
        ...     if sort_q is not None and desc:
        ...         sort_q = sort_q.desc()
        ...     return sort_q

    Now we can pass the sort to a :func:`query` field::

        >>> sch = schema(fields=lambda: {
        ...     'region': query(q.region, type=region, sort=sort_region)
        ... })

    Note how ``sort_by`` and ``desc`` arguments are configured for the
    ``region`` field::

        >>> data = execute(sch, '''
        ... {
        ...     region(sort_by: name) { name }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']]
        ['AFRICA', 'AMERICA', 'ASIA', 'EUROPE', 'MIDDLE EAST']

        >>> data = execute(sch, '''
        ... {
        ...     region(sort_by: name, desc: true) { name }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']]
        ['MIDDLE EAST', 'EUROPE', 'ASIA', 'AMERICA', 'AFRICA']

        >>> data = execute(sch, '''
        ... {
        ...     region(sort_by: comment) { name }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']]
        ['ASIA', 'AMERICA', 'AFRICA', 'EUROPE', 'MIDDLE EAST']

        >>> data = execute(sch, '''
        ... {
        ...     region { name }
        ... }
        ... ''')
        >>> [region['name'] for region in data.data['region']]
        ['AFRICA', 'AMERICA', 'ASIA', 'EUROPE', 'MIDDLE EAST']

    .. note::
        Sorts defined using :func:`sort_from_function` are not being
        typechecked against database schema and therefore it is advised not to
        use it unless absolutely neccessary. Prefer to use sorts-as-queries if
        your sorts are not dynamic (do not depend on arguments).

    """

    def decorate(f):
        params, _ = extract_params(f)
        return SortOfFunction(params=params, f=f)

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
            for name, param in params.items():
                if param.name in values:
                    kwargs[name] = values[param.name]
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


def connectiontype_name(entitytype, name="connection"):
    return f"{entitytype.name}_{name}"


def connectiontype_uncached(
    entitytype,
    entitytype_complete=None,
    fields=None,
    filters=None,
    sort=None,
    name="connection",
):
    if fields is None:
        fields = lambda entitytype, entitytype_complete: {}
    entitytype_complete = entitytype_complete or entitytype
    by_id = q.id == argument("id", EntityId(entitytype.name))

    @filter_from_function()
    def by_id_many(ids: argument("id", List(EntityId(entitytype.name)))):
        if not ids:
            yield False
        else:
            expr = q.id == ids[0]
            for id in ids[1:]:
                expr = expr | (q.id == id)
            yield expr

    return Record(
        name=connectiontype_name(entitytype=entitytype, name=name),
        fields=lambda: {
            "get": query(
                q.entity.filter(by_id).first(),
                type=entitytype_complete,
                description=f"Get {entitytype.name} by id",
                loc=None,
            ),
            "get_many": query(
                q.entity,
                filters=[by_id_many],
                type=entitytype_complete,
                description=f"Get multiple {entitytype.name} by id",
                loc=None,
            ),
            "all": query(
                q.entity,
                type=entitytype,
                filters=filters,
                sort=sort,
                description=f"Get all {entitytype.name} items",
                loc=None,
            ),
            "paginated": query(
                q.entity,
                type=entitytype,
                filters=filters,
                paginate=True,
                sort=sort,
                description=f"Get all {entitytype.name} items (paginated)",
                loc=None,
            ),
            "count": query(
                q.entity,
                filters=filters,
                finalize_query=lambda q: q.count(),
                description=f"Get the number of {entitytype.name} items",
                loc=None,
            ),
            **fields(entitytype, entitytype_complete),
        },
        loc=None,
    )


connectiontype = cached(connectiontype_uncached)


def connect(
    type: Entity,
    query: Q = None,
    filters: t.List[Filter] = None,
    sort=None,
    type_complete: Entity = None,
    fields=None,
    description=None,
    loc=autoloc,
    name="connection",
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
        type=connectiontype(
            entitytype=type,
            entitytype_complete=type_complete,
            filters=tuple(filters) if filters else None,
            fields=fields,
            sort=sort,
            name=name,
        ),
        description=description or f"Connection to {type.name}",
        loc=loc,
    )


no_default_value = object()


class Argument(Param):
    """ Param passed an GraphQL argument."""

    def __init__(
        self,
        name,
        type,
        default_value=no_default_value,
        description=None,
        out_name=None,
        loc=autoloc,
    ):
        super(Argument, self).__init__(name=name, type=type)
        self.loc = code_location.here() if loc is autoloc else loc
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
        super(ComputedParam, self).__init__(name=name, type=type)
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


class Directive:
    def __init__(self, name, params, description=None):
        self.name = name
        self.params = params
        self.description = description


include_directive = Directive(
    name="include",
    params={
        "if": Argument(
            name="if",
            type=NonNull(scalar.Boolean),
            description="Included when true.",
        )
    },
    description="Include this field only when 'if' argument is true.",
)
skip_directive = Directive(
    name="skip",
    params={
        "if": Argument(
            name="if",
            type=NonNull(scalar.Boolean),
            description="Skipped when true.",
        )
    },
    description="Skip this field when 'if' argument is true.",
)


def query(
    query: Q,
    type: Type = None,
    filters: t.List[t.Union[Q, Filter]] = None,
    name: t.Optional[str] = None,
    description: t.Optional[str] = None,
    deprecation_reason: t.Optional[str] = None,
    sort: t.Optional[Q] = None,
    paginate: bool = False,
    finalize_query=None,
    transform=None,
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
    :param transform:
        Specify how to transform result of the query, ``type`` param must be
        supplied if ``transform`` is supplied.
    :param sort: Specify sort order via query
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
        finalize_query=finalize_query,
        transform=transform,
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
    default_value: t.Any = no_default_value,
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


@cached
def sort_direction_type(type, keys):

    field_type = Enum(
        name=f"sort_{type.name}_field",
        values=[EnumValue(name=key) for key in keys],
    )

    sort_direction_type = InputObject(
        name=f"sort_{type.name}_direction",
        fields=lambda: {
            "field": InputObjectField(field_type),
            "desc": InputObjectField(scalar.Boolean, default_value=False),
        },
    )

    return sort_direction_type


def sort(type, **fields):
    """ Define sort for a type.

    Example::

        >>> sch = schema(fields=lambda: {
        ...     'region': query(
        ...         q.region,
        ...         type=region,
        ...         sort=sort(
        ...             region,
        ...             name=q.name,
        ...             nation_count=q.nation.count()
        ...         )
        ...     )
        ... })

        >>> res = execute(sch, "{ region(sort: {field: name}) { name } }")
        >>> [region['name'] for region in res.data['region']]
        ['AFRICA', 'AMERICA', 'ASIA', 'EUROPE', 'MIDDLE EAST']

        >>> res = execute(sch, "{ region(sort: {field: name, desc: true}) { name } }")
        >>> [region['name'] for region in res.data['region']]
        ['MIDDLE EAST', 'EUROPE', 'ASIA', 'AMERICA', 'AFRICA']

    """
    sort_keys = tuple(fields.keys())
    sort_type = sort_direction_type(type=type, keys=sort_keys)

    @sort_from_function()
    def sort(sort: sort_type = None):
        q_sort = None
        if sort is not None:
            q_sort = fields[sort["field"]]
            if sort["desc"]:
                q_sort = q_sort.desc()
        return q_sort

    return sort


class Mutation(Desc):
    """ A GraphQL Mutation.
    """

    def __init__(self, name, compute):
        self.name = name
        self.compute = compute


def mutation_from_function(
    description=None, deprecation_reason=None, loc=autoloc, name=None
):
    """ Define a mutation."""
    make = compute_from_function(
        description=description, deprecation_reason=deprecation_reason, loc=loc
    )

    def decorate(f):
        mutation_name = name or f.__name__
        return Mutation(name=mutation_name, compute=make(f))

    return decorate


def create_entity_from_function(typ, query_entity=None, **kw):
    """ Decorator to define a mutation which creates a new entity.

    The function must perform database access to insert a new entity and return
    either an ID of a newly created entity or a pair of ``None, error_message``,
    in case of an error.

    Note that you don't have to define a result type as it's fixed to a type
    you've provided as an argument to the decorator.

    Example::

        >>> from rex.db import get_db

        >>> @create_entity_from_function(region)
        ... def create_region(name: scalar.String):
        ...     exists = q.region.filter(q.name == name).exists().produce()
        ...     if exists:
        ...         return None, 'region with the same name already exists'
        ...     res = get_db().produce('''
        ...         /insert(region := {name := $name})
        ...     ''', name=name)
        ...     return res.data

        >>> sch = schema(fields=lambda: {
        ...     'region': query(q.region, type=region)
        ... }, mutations=[create_region])

        >>> res = execute(sch, '''
        ...     mutation {
        ...         res: create_region(name: "ASIA") {
        ...             error
        ...             created { id }
        ...         }
        ...     }
        ... ''')

        >>> res.errors is None
        True

        >>> res.data['res']['error']
        'region with the same name already exists'

        >>> res.data['res']['created'] is None
        True

        >>> res = execute(sch, '''
        ...     mutation {
        ...         res: create_region(name: "ATLANTIDA") {
        ...             error
        ...             created { id }
        ...         }
        ...     }
        ... ''')

        >>> res.errors

        >>> res.data['res']['error']

        >>> res.data['res']['created']
        OrderedDict([('id', 'ATLANTIDA')])

    """

    @compute_from_function(description="Error")
    def error(parent: parent_param) -> scalar.String:
        if not (isinstance(parent, tuple) and parent[0] is None):
            return None
        else:
            return parent[1]

    def get_id_param(parent, ctx):
        if not (isinstance(parent, tuple) and parent[0] is None):
            return str(parent)
        else:
            return None

    id_param = param(name="id", type=scalar.String, f=get_id_param,)

    if query_entity is None:
        query_created = q[typ.name].filter(q.id.text() == id_param).first()
    else:
        query_created = query_entity.filter(q.id.text() == id_param).first()

    def decorate(f):
        description = kw.pop("description", None) or f"Create new {typ.name}"
        name = kw.pop("name", None) or f.__name__ or f"create_{typ.name}"
        params, return_type = extract_params(
            f, mark_as_nonnull_if_no_default_value=True
        )

        Result = Object(
            name=f"{name}_result",
            fields=lambda: {
                "error": error,
                "created": query(query_created, type=typ),
            },
        )

        def run(parent, info, values):
            kwargs = {}
            for name, param in params.items():
                if param.name in values:
                    kwargs[name] = values[param.name]
            res = f(**kwargs)
            return res

        return Mutation(
            name=name,
            compute=compute(
                params=params.values(),
                f=run,
                type=Result,
                name=name,
                description=description,
                **kw,
            ),
        )

    return decorate


def update_entity_from_function(typ, query_entity=None, **kw):
    """ Decorator to define a mutation which updated an entity.

    Example::

        >>> from rex.db import get_db

        >>> @update_entity_from_function(region)
        ... def update_region(id: entity_id.region, name: scalar.String):
        ...     exists = q.region.filter(q.id == id).exists().produce()
        ...     if not exists:
        ...         return None, f'no region "{id}" exists in the database'
        ...     res = get_db().produce('''
        ...         /region.filter(id()=$id) {
        ...             id(),
        ...             name := $name
        ...         }/:update
        ...     ''', id=id, name=name)
        ...     return res.data[0]

        >>> sch = schema(fields=lambda: {
        ...     'region': query(q.region, type=region)
        ... }, mutations=[update_region])

        >>> res = execute(sch, '''
        ...     mutation {
        ...         res: update_region(id: "UNKNOWN", name: "ASIA2") {
        ...             error
        ...             updated { id }
        ...         }
        ...     }
        ... ''')

        >>> res.errors

        >>> res.data['res']['error']
        'no region "UNKNOWN" exists in the database'

        >>> res.data['res']['updated'] is None
        True

        >>> res = execute(sch, '''
        ...     mutation {
        ...         res: update_region(id: "ASIA", name: "ASIA2") {
        ...             error
        ...             updated { id }
        ...         }
        ...     }
        ... ''')

        >>> res.errors

        >>> res.data['res']['error']

        >>> res.data['res']['updated']
        OrderedDict([('id', 'ASIA2')])

    """

    @compute_from_function(description="Error")
    def error(parent: parent_param) -> scalar.String:
        if not (isinstance(parent, tuple) and parent[0] is None):
            return None
        else:
            return parent[1]

    def get_id_param(parent, ctx):
        if not (isinstance(parent, tuple) and parent[0] is None):
            return str(parent)
        else:
            return None

    id_param = param(name="id", type=scalar.String, f=get_id_param,)

    if query_entity is None:
        query_created = q[typ.name].filter(q.id.text() == id_param).first()
    else:
        query_created = query_entity.filter(q.id.text() == id_param).first()

    def decorate(f):
        description = kw.pop("description", None) or f"Update {typ.name}"
        name = kw.pop("name", None) or f.__name__ or f"update_{typ.name}"

        params, return_type = extract_params(
            f, mark_as_nonnull_if_no_default_value=True
        )

        if "id" not in params:
            raise Error(
                "update_entity_from_function() mutation needs to access id argument"
            )

        Result = Object(
            name=f"{name}_result",
            fields=lambda: {
                "error": error,
                "updated": query(query_created, type=typ),
            },
        )

        def run(parent, info, values):
            kwargs = {}
            for name, param in params.items():
                if param.name in values:
                    kwargs[name] = values[param.name]
            res = f(**kwargs)
            return res

        return Mutation(
            name=name,
            compute=compute(
                params=params.values(),
                f=run,
                type=Result,
                name=name,
                description=description,
                **kw,
            ),
        )

    return decorate


def delete_entity_from_function(typ, query_entity=None, **kw):
    """ Decorator to define a mutation which deletes an entity.
    """

    @compute_from_function(description="Error")
    def error(parent: parent_param) -> scalar.String:
        if not (isinstance(parent, tuple) and parent[0] is None):
            return None
        else:
            return parent[1]

    @compute_from_function(description="ID of the deleted entity")
    def deleted(parent: parent_param) -> entity_id[typ.name]:
        if not (isinstance(parent, tuple) and parent[0] is None):
            return parent
        else:
            return None

    def decorate(f):
        description = kw.pop("description", None) or f"Delete {typ.name}"
        name = kw.pop("name", None) or f.__name__ or f"delete_{typ.name}"

        params, return_type = extract_params(
            f, mark_as_nonnull_if_no_default_value=True
        )
        if "id" not in params:
            raise Error(
                "delete_entity_from_function() mutation needs to access id argument"
            )

        Result = Object(
            name=f"{name}_result",
            fields=lambda: {"error": error, "deleted": deleted},
        )

        def run(parent, info, values):
            kwargs = {}
            for name, param in params.items():
                if param.name in values:
                    kwargs[name] = values[param.name]
            res = f(**kwargs)
            if res is None:
                res = True
            return res

        return Mutation(
            name=name,
            compute=compute(
                params=params.values(),
                f=run,
                type=Result,
                name=name,
                description=description,
                **kw,
            ),
        )

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
