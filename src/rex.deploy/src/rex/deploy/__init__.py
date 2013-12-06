#
# Copyright (c) 2013, Prometheus Research, LLC
#


"""
This package provides database schema management.
"""


from .cluster import Cluster, get_cluster, deploy
from .column import ColumnFact
from .data import DataFact, SKIP
from .fact import Driver
from .identity import IdentityFact
from .image import (make_catalog, Image, NamedImage, ImageMap, CatalogImage,
        SchemaImage, TypeImage, DomainTypeImage, EnumTypeImage, TableImage,
        ColumnImage, ConstraintImage, UniqueKeyImage, ForeignKeyImage,
        DataImage)
from .introspect import introspect
from .link import LinkFact
from .sql import (mangle, sql_name, sql_value, sql_create_database,
        sql_drop_database, sql_select_database, sql_create_table,
        sql_drop_table, sql_define_column, sql_add_column, sql_drop_column,
        sql_add_unique_constraint, sql_add_foreign_key_constraint,
        sql_drop_constraint, sql_create_enum_type, sql_drop_type, sql_select,
        sql_insert, sql_update, sql_delete)
from .table import TableFact

