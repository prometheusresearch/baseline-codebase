"""

    rex.graphql.schema
    ==================

    :copyright: 2019-present Prometheus Research, LLC

"""

import typing as t

from rex.core import Error, Extension
from rex.db import get_db, RexHTSQL

from . import introspection, model, model_scalar, desc, code_location


class SchemaConfig(Extension):
    """ Configurator for GraphQL schema."""

    @classmethod
    def sanitize(cls):
        # Do not check Endpoint itself.
        if cls.__bases__ == (Extension,):
            return
        name = cls.name or f"{cls.__module__}.{cls.__qualname__}"
        assert (
            cls.__call__ is not NotImplemented
        ), f"{name}: missing .__call__(self) method"

    @classmethod
    def enabled(cls):
        return cls.__call__ is not NotImplemented

    @classmethod
    def signature(cls):
        return cls.name or f"{cls.__module__}.{cls.__qualname__}"

    @classmethod
    def get(cls, name):
        if isinstance(name, type) and issubclass(name, SchemaConfig):
            name = name.signature()
        make_schema_cls = cls.mapped().get(name)
        if make_schema_cls is None:
            raise Error("No such GraphQL schema defined:", name)
        db = get_db()
        make_schema = make_schema_cls(db)
        return make_schema()

    def __init__(self, db):
        self.db = db

    name = None
    __call__ = NotImplemented


class Schema:
    """ GraphQL schema."""

    def __init__(self, query_type, mutation_type, directives, types, loc):
        self.query_type = query_type
        self.mutation_type = mutation_type
        self.types = types
        self.directives = directives
        self.loc = loc
        self.skip_directive = self.directives["skip"]
        self.include_directive = self.directives["include"]

    def __getitem__(self, name):
        return self.types[name]

    def get(self, name, default=None):
        return self.types.get(name, default)


def schema(
    fields: desc.FieldsType,
    mutations=None,
    directives=None,
    db: t.Optional[t.Union[RexHTSQL, str]] = None,
    loc=desc.autoloc,
) -> Schema:
    """ Define a GraphQL schema.

    Schema is defined by supplying a set of either :func:`compute` or
    :func:`query` fields.

    Example::

        >>> sch = schema(
        ...     fields=lambda: {
        ...         'region': query(q.region, type=region),
        ...         'settings': compute(type=settings, f=get_settings)
        ...     }
        ... )

    If ``db`` argument is passed then it will be used to validate query fields
    against the database, otherwise the default database (returned via
    ``rex.db.get_db()`` will be used).

    :param fields: Fields for the root query type
    :param db: Database to use, if ``None`` then the default one is used
    """
    if not callable(fields):
        raise Error("Argument 'fields' should be a function")

    loc = code_location.here() if loc is desc.autoloc else None

    if db is None:
        db = get_db()

    query_type = desc.Object(
        name="Root",
        fields=lambda: {
            **fields(),
            # Inject introspection API.
            "__schema": introspection.schema_field,
            "__type": introspection.type_field,
        },
        description=None,
        loc=None,
    )

    if mutations:
        mutation_type = desc.Object(
            name="Mutations",
            fields=lambda: {
                mutation.name: mutation.compute for mutation in mutations
            },
            description=None,
            loc=None,
        )
    else:
        mutation_type = None

    types = {}

    for scalar_type in (
        model_scalar.id_type,
        model_scalar.string_type,
        model_scalar.boolean_type,
        model_scalar.int_type,
        model_scalar.float_type,
        model_scalar.json_type,
        model_scalar.decimal_type,
        model_scalar.date_type,
        model_scalar.datetime_type,
        model_scalar.time_type,
    ):
        types[scalar_type.name] = scalar_type

    ctx = model.RootSchemaContext(types=types, loc=loc)
    with db:
        with code_location.context(loc, desc="While configuring schema:"):
            # Queries.
            query_type = model.construct(query_type, ctx)
            # Mutations.
            if mutation_type:
                mutation_type = model.construct(mutation_type, ctx)
            # Directives.
            if not directives:
                directives = {}
            # Mandated by GraphQL spec.
            directives.update(
                {
                    "skip": desc.skip_directive,
                    "include": desc.include_directive,
                }
            )
            directives = {
                name: model.construct(directive, ctx)
                for name, directive in directives.items()
            }

    return Schema(
        query_type=query_type,
        mutation_type=mutation_type,
        directives=directives,
        types=ctx.types,
        loc=loc,
    )
