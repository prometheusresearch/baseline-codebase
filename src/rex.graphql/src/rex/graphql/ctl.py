"""

    rex.graphql.ctl
    ===============

    Command line utilities.

    :copyright: 2020-present Prometheus Research, LLC

"""

import json
import yaml
from rex.ctl import RexTask, argument, option
from .schema import SchemaConfig
from .execute import execute


class GraphQLSchemaLs(RexTask):
    """ List all GraphQL schemas defined"""

    name = "graphql-schema-ls"

    def __call__(self):
        with self.make():
            data = []
            for config in SchemaConfig.all():
                item = {"name": config.signature()}
                if config.__doc__:
                    item["doc"] = config.__doc__.strip()
                data.append(item)
            print(yaml.dump(data, sort_keys=False))


class GraphQLSchemaDump(RexTask):
    """ Dump GraphQL schema as JSON"""

    name = "graphql-schema-dump"

    INTROSPECTION_QUERY = """
        query IntrospectionQuery {
            __schema {
                queryType { name }
                mutationType { name }
                types {
                    ...FullType
                }
                directives {
                    name
                    description
                    locations
                    args {
                        ...InputValue
                    }
                }
            }
        }

        fragment FullType on __Type {
            kind
            name
            description
            fields(includeDeprecated: true) {
                name
                description
                args {
                    ...InputValue
                }
                type {
                    ...TypeRef
                }
                isDeprecated
                deprecationReason
            }
            inputFields {
                ...InputValue
            }
            interfaces {
                ...TypeRef
            }
            enumValues(includeDeprecated: true) {
                name
                description
                isDeprecated
                deprecationReason
            }
            possibleTypes {
                ...TypeRef
            }
        }

        fragment InputValue on __InputValue {
            name
            description
            type { ...TypeRef }
            defaultValue
        }

        fragment TypeRef on __Type {
            kind
            name
            ofType {
                kind
                name
                ofType {
                    kind
                    name
                    ofType {
                        kind
                        name
                        ofType {
                            kind
                            name
                            ofType {
                                kind
                                name
                                ofType {
                                    kind
                                    name
                                    ofType {
                                        kind
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    """

    class arguments:
        name = argument()

    class options:
        output = option("o", default=None)

    def __call__(self):
        with self.make():
            schema = SchemaConfig.get(self.name)
            res = execute(schema, self.INTROSPECTION_QUERY)
            assert not res.errors
            assert res.data
            from graphql.utils.base import build_client_schema
            from graphql.utils.base import print_schema
            data = json.dumps(res.data, indent=2)
            schema = build_client_schema(res.data)
            data = print_schema(schema)
            if self.output is None:
                print(data)
            else:
                with open(self.output, "w") as f:
                    f.write(data)


class GraphQLSchemaValidate(RexTask):
    """ Validate GraphQL schema against the database"""

    name = "graphql-schema-validate"

    class arguments:
        name = argument()

    def __call__(self):
        with self.make():
            _ = SchemaConfig.get(self.name)
