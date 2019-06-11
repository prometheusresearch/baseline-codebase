import collections
from cached_property import cached_property

from graphql import language

from .desc import (
    argument,
    compute,
    Object,
    NonNull,
    List,
    scalar,
    Enum,
    EnumValue,
)
from . import model, model_scalar

__Schema = Object(
    name="__Schema",
    description="A GraphQL Schema defines the capabilities of a GraphQL server. It "
    "exposes all available types and directives on the server, as well as "
    "the entry points for query, mutation and subscription operations.",
    fields=lambda: {
        "types": compute(
            description="A List of all types supported by this server.",
            type=NonNull(List(NonNull(__Type))),
            f=lambda schema, info, params: [
                type
                for type in schema.types.values()
                if not type.name.startswith("__")
            ],
        ),
        "queryType": compute(
            description="The type that query operations will be rooted at.",
            type=NonNull(__Type),
            f=lambda schema, info, params: schema.type,
        ),
        "mutationType": compute(
            description="If this server supports mutation, the type that "
            "mutation operations will be rooted at.",
            type=__Type,
            # TODO: Fix this if-when we start supporting mutations.
            f=lambda schema, info, params: None,
        ),
        "subscriptionType": compute(
            description="If this server support subscription, the type "
            "that subscription operations will be rooted at.",
            type=__Type,
            # TODO: Fix this if-when we start supporting subscriptions.
            f=lambda schema, info, params: None,
        ),
        "directives": compute(
            description="A List of all directives supported by this server.",
            type=NonNull(List(NonNull(scalar.String))),
            # TODO: Fix this if-when we start supporting directives.
            f=lambda schema, info, params: [],
        ),
    },
)

__Type = Object(
    "__Type",
    description="The fundamental unit of any GraphQL Schema is the __Type. There are "
    "many kinds of types in GraphQL as represented by the `__TypeKind` Enum."
    "\n\nDepending on the kind of a type, certain fields describe "
    "information about that type. Scalar types provide no information "
    "beyond a name and description, while Enum types provide their values. "
    "Object and Interface types provide the fields they describe. Abstract "
    "types, Union and Interface, provide the Object types possible "
    "at runtime. List and NonNull types compose other types.",
    fields=lambda: {
        "kind": compute(type=NonNull(__TypeKind), f=TypeFieldResolvers.kind),
        "name": compute(scalar.String),
        "description": compute(scalar.String),
        "fields": compute(
            type=List(NonNull(__Field)),
            params=[
                argument(
                    "includeDeprecated", scalar.Boolean, default_value=False
                )
            ],
            f=TypeFieldResolvers.fields,
        ),
        "interfaces": compute(
            type=List(NonNull(__Type)), f=TypeFieldResolvers.interfaces
        ),
        "possibleTypes": compute(
            type=List(NonNull(__Type)), f=TypeFieldResolvers.possible_types
        ),
        "enumValues": compute(
            type=List(NonNull(__EnumValue)),
            params=[
                argument(
                    "includeDeprecated", scalar.Boolean, default_value=False
                )
            ],
            f=TypeFieldResolvers.enum_values,
        ),
        "inputFields": compute(
            type=List(NonNull(__InputValue)), f=TypeFieldResolvers.input_fields
        ),
        "ofType": compute(
            type=__Type, f=lambda type, *_: getattr(type, "type", None)
        ),
    },
)


class TypeKind:
    SCALAR = "SCALAR"
    OBJECT = "OBJECT"
    INTERFACE = "INTERFACE"
    UNION = "UNION"
    ENUM = "ENUM"
    INPUT_OBJECT = "INPUT_OBJECT"
    LIST = "LIST"
    NON_NULL = "NON_NULL"


__TypeKind = Enum(
    name="__TypeKind",
    description="An Enum describing what kind of type a given `__Type` is",
    values=[
        EnumValue(
            TypeKind.SCALAR, description="Indicates this type is a scalar."
        ),
        EnumValue(
            TypeKind.OBJECT,
            description="Indicates this type is an Object. "
            "`fields` and `interfaces` are valid fields.",
        ),
        EnumValue(
            TypeKind.INTERFACE,
            description="Indicates this type is an interface. "
            "`fields` and `possibleTypes` are valid fields.",
        ),
        EnumValue(
            TypeKind.UNION,
            description="Indicates this type is a union. "
            "`possibleTypes` is a valid field.",
        ),
        EnumValue(
            TypeKind.ENUM,
            description="Indicates this type is an Enum. "
            "`enumValues` is a valid field.",
        ),
        EnumValue(
            TypeKind.INPUT_OBJECT,
            description="Indicates this type is an input Object. "
            "`inputFields` is a valid field.",
        ),
        EnumValue(
            TypeKind.LIST,
            description="Indicates this type is a List. "
            "`ofType` is a valid field.",
        ),
        EnumValue(
            TypeKind.NON_NULL,
            description="Indicates this type is a non-null. "
            "`ofType` is a valid field.",
        ),
    ],
)


__Field = Object(
    name="__Field",
    description="Object and Interface types are described by a List of Fields, each of "
    "which has a name, potentially a List of arguments, and a return type.",
    fields=lambda: {
        "name": compute(NonNull(scalar.String)),
        "description": compute(scalar.String),
        "args": compute(
            type=NonNull(
                List(NonNull(__InputValue))  # type: ignore
            ),
            f=lambda field, info, params: input_fields_to_list(field.args),
        ),
        "type": compute(NonNull(__Type)),
        "isDeprecated": compute(
            type=NonNull(scalar.Boolean),
            f=lambda field, info, params: bool(field.deprecation_reason),
        ),
        "deprecationReason": compute(
            type=scalar.String,
            f=lambda field, info, params: field.deprecation_reason,
        ),
    },
)

__InputValue = Object(
    name="__InputValue",
    description="Arguments provided to Fields or Directives and the input fields of an "
    "InputObject are represented as Input Values which describe their type "
    "and optionally a default value.",
    fields=lambda: {
        "name": compute(NonNull(scalar.String)),
        "description": compute(scalar.String),
        "type": compute(NonNull(__Type)),
        "defaultValue": compute(
            type=scalar.String,
            f=lambda input_val, *_: None
            if input_val.default_value is None
            else language.printer.print_ast(
                ast_from_value(input_val.default_value, input_val)
            ),
        ),
    },
)

__EnumValue = Object(
    name="__EnumValue",
    description="One possible value for a given Enum. Enum values are unique values, not "
    "a placeholder for a string or numeric value. However an Enum value is "
    "returned in a JSON response as a string.",
    fields=lambda: {
        "name": compute(type=NonNull(scalar.String)),
        "description": compute(scalar.String),
        "isDeprecated": compute(
            type=NonNull(scalar.Boolean),
            f=lambda value, info, params: bool(value.deprecation_reason),
        ),
        "deprecationReason": compute(
            type=scalar.String,
            f=lambda value, info, params: value.deprecation_reason,
        ),
    },
)

Field = collections.namedtuple(
    "Field", ["name", "type", "description", "args", "deprecation_reason"]
)

InputField = collections.namedtuple(
    "InputField", ["name", "description", "type", "default_value"]
)


class TypeFieldResolvers:
    @classmethod
    def _kinds(cls):
        return (
            (model.ScalarType, TypeKind.SCALAR),
            (model.ObjectType, TypeKind.OBJECT),
            # (GraphQLInterfaceType, TypeKind.INTERFACE),
            # (GraphQLUnionType, TypeKind.UNION),
            (model.EnumType, TypeKind.ENUM),
            # (GraphQLInputObjectType, TypeKind.INPUT_OBJECT),
            (model.ListType, TypeKind.LIST),
            (model.NonNullType, TypeKind.NON_NULL),
        )

    @classmethod
    def kind(
        cls,
        type,  # type: Union[GraphQLInterfaceType, GraphQLUnionType]
        info,
        args,  # type: ResolveInfo
    ):
        # type: (...) -> str
        for klass, kind in cls._kinds():
            if isinstance(type, klass):
                return kind

        raise Exception("Unknown kind of type: {}".format(type))

    @staticmethod
    def fields(
        type,  # type: Union[GraphQLInterfaceType, GraphQLUnionType]
        info,  # type: ResolveInfo
        args,
    ):
        # type: (...) -> Optional[List[Field]]
        include_deprecated = args.get("includeDeprecated")
        if isinstance(type, (model.ObjectType, model.EntityType)):
            fields = []
            for field_name, field in type.fields.items():
                if field_name.startswith("__"):
                    continue
                if field.deprecation_reason and not include_deprecated:
                    continue
                fields.append(
                    Field(
                        name=field_name,
                        description=field.description,
                        type=field.type,
                        args=field.args,
                        deprecation_reason=field.deprecation_reason,
                    )
                )
            return fields
        return None

    @staticmethod
    def interfaces(type, info, args):
        # type: (Optional[GraphQLObjectType], ResolveInfo) -> Optional[List[GraphQLInterfaceType]]
        # TODO:
        # if isinstance(type, GraphQLObjectType):
        #     return type.interfaces
        return []

    @staticmethod
    def possible_types(
        type,  # type: Union[GraphQLInterfaceType, GraphQLUnionType]
        info,  # type: ResolveInfo
        args,  # type: Any
    ):
        # type: (...) -> List[GraphQLObjectType]
        # TODO:
        # if isinstance(type, (GraphQLInterfaceType, GraphQLUnionType)):
        #     return info.schema.get_possible_types(type)
        return []

    @staticmethod
    def enum_values(
        type,  # type: GraphQLEnumType
        info,  # type: ResolveInfo
        args,  # type: bool
    ):
        # type: (...) -> Optional[List[GraphQLEnumValue]]
        include_deprecated = args.get("includeDeprecated")
        if isinstance(type, model.EnumType):
            values = type.values
            if not include_deprecated:
                values = [v for v in values if not v.deprecation_reason]

            return values
        return None

    @staticmethod
    def input_fields(type, info, args):
        # type: (GraphQLInputObjectType, ResolveInfo) -> List[InputField]
        # TODO:
        # if isinstance(type, GraphQLInputObjectType):
        #     return input_fields_to_list(type.fields)
        return []


def input_fields_to_list(input_fields):
    # type: (Dict[str, GraphQLInputObjectField]) -> List[InputField]
    fields = []
    for field_name, field in input_fields.items():
        fields.append(
            InputField(
                name=field_name,
                description=field.description,
                type=field.type,
                default_value=field.default_value,
            )
        )
    return fields


def ast_from_value(value, type=None):
    if isinstance(type, model.NonNullType):
        return ast_from_value(value, type.type)

    if value is None:
        return None

    if isinstance(value, List):
        item_type = type.type if isinstance(type, model.ListType) else None
        return language.ast.ListValue(
            [ast_from_value(item, item_type) for item in value]
        )

    elif isinstance(type, model.ListType):
        return ast_from_value(value, type.type)

    if isinstance(value, bool):
        return language.ast.BooleanValue(value)

    if isinstance(value, (int, float)):
        string_num = str(value)
        int_value = int(value)
        is_int_value = string_num.isdigit()

        if is_int_value or (int_value == value and value < sys.maxsize):
            if type == model_scalar.float_type:
                return language.ast.FloatValue(str(float(value)))

            return language.ast.IntValue(str(int(value)))

        return language.ast.FloatValue(string_num)

    if isinstance(value, str):
        if isinstance(type, model.EnumType) and re.match(
            r"^[_a-zA-Z][_a-zA-Z0-9]*$", value
        ):
            return language.ast.EnumValue(value)

        return language.ast.StringValue(json.dumps(value)[1:-1])

    assert isinstance(value, dict)

    fields = []
    # TODO:
    # is_graph_ql_input_object_type = isinstance(type, GraphQLInputObjectType)
    is_graph_ql_input_object_type = False

    for field_name, field_value in value.items():
        field_type = None
        if is_graph_ql_input_object_type:
            field_def = type.fields.get(field_name)
            field_type = field_def and field_def.type

        field_value = ast_from_value(field_value, field_type)
        if field_value:
            fields.append(
                language.ast.ObjectField(ast.Name(field_name), field_value)
            )

    return language.ast.ObjectValue(fields)


typename_field = compute(
    type=NonNull(scalar.String),
    description="The name of the current Object __Type at runtime.",
    f=lambda source, info, params: info.parent_type.name,
)

schema_field = compute(
    type=NonNull(__Schema),
    description="Access the current type schema of this server.",
    f=lambda source, info, params: info.schema,
    params={},
)

type_field = compute(
    type=__Type,
    description="Request the type information of a single type.",
    params=[argument("name", NonNull(scalar.String))],
    f=lambda source, info, params: info.schema.get(params["name"]),
)
