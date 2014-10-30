#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.deploy import Driver
from htsql.core.cache import once
from htsql.core.entity import make_catalog
from htsql.core.connect import connect
from htsql.core.domain import (BooleanDomain, IntegerDomain, FloatDomain,
        DecimalDomain, TextDomain, EnumDomain, DateDomain, TimeDomain,
        DateTimeDomain, OpaqueDomain)
from htsql_pgsql.core.introspect import IntrospectPGSQL


@once
def get_image():
    # Returns `rex.deploy` catalog image.
    connection = connect()
    driver = Driver(connection)
    catalog = driver.get_catalog()
    connection.close()
    return catalog


class IntrospectDeploy(IntrospectPGSQL):
    # Generates HTSQL catalog from rex.deploy catalog.

    def __call__(self):
        catalog_image = get_image()
        schema_image = catalog_image[u'public']

        catalog = make_catalog()
        schema = catalog.add_schema(schema_image.name)

        for table_image in schema_image:
            table = schema.add_table(table_image.name)
            for column_image in table_image:
                name = column_image.name
                type_image = column_image.type
                while type_image.is_domain:
                    type_image = type_image.base_type
                if type_image.is_enum:
                    domain = EnumDomain(type_image.labels)
                else:
                    type_code = (type_image.schema.name, type_image.name)
                    if type_code == ('pg_catalog', 'bool'):
                        domain = BooleanDomain()
                    elif type_code in [('pg_catalog', 'int2'),
                                       ('pg_catalog', 'int4'),
                                       ('pg_catalog', 'int8')]:
                        domain = IntegerDomain()
                    elif type_code == ('pg_catalog', 'numeric'):
                        domain = DecimalDomain()
                    elif type_code in [('pg_catalog', 'float4'),
                                       ('pg_catalog', 'float8')]:
                        domain = FloatDomain()
                    elif type_code in [('pg_catalog', 'bpchar'),
                                       ('pg_catalog', 'varchar'),
                                       ('pg_catalog', 'text')]:
                        domain = TextDomain()
                    elif type_code == ('pg_catalog', 'date'):
                        domain = DateDomain()
                    elif type_code in [('pg_catalog', 'time'),
                                       ('pg_catalog', 'timetz')]:
                        domain = TimeDomain()
                    elif type_code in [('pg_catalog', 'timestamp'),
                                       ('pg_catalog', 'timestamptz')]:
                        domain = DateTimeDomain()
                    else:
                        domain = OpaqueDomain()
                is_nullable = (not column_image.is_not_null)
                has_default = False
                table.add_column(name, domain, is_nullable, has_default)

        for table_image in schema_image:
            table = schema[table_image.name]
            for unique_key_image in table_image.unique_keys:
                columns = [table[column_image.name]
                           for column_image in unique_key_image]
                table.add_unique_key(columns, unique_key_image.is_primary)
            for foreign_key_image in table_image.foreign_keys:
                target_table_image = foreign_key_image.target
                if target_table_image.schema != schema_image:
                    continue
                target_table = schema[target_table_image.name]
                columns = [table[column_image.name]
                           for column_image in foreign_key_image.origin_columns]
                target_columns = [target_table[column_image.name]
                                  for column_image
                                        in foreign_key_image.target_columns]
                table.add_foreign_key(columns, target_table, target_columns)

        return catalog


