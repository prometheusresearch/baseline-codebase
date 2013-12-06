****************************
  REX.DEPLOY API Reference
****************************

.. contents:: Table of Contents

.. automodule:: rex.deploy


Introspection and database catalog
==================================

.. autofunction:: introspect
.. autofunction:: make_catalog
.. autoclass:: Image
.. autoclass:: NamedImage
.. autoclass:: ImageMap
   :special-members: __contains__, __getitem__, __iter__, __len__, __nonzero__
.. autoclass:: CatalogImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: SchemaImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: TypeImage
.. autoclass:: DomainTypeImage
.. autoclass:: EnumTypeImage
.. autoclass:: TableImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: ColumnImage
.. autoclass:: ConstraintImage
.. autoclass:: UniqueKeyImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: ForeignKeyImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: DataImage


Cluster management
==================

.. autoclass:: Cluster
.. autofunction:: get_cluster


SQL Serialization
=================

.. autofunction:: mangle
.. autofunction:: sql_name
.. autofunction:: sql_value
.. autofunction:: sql_create_database
.. autofunction:: sql_drop_database
.. autofunction:: sql_select_database
.. autofunction:: sql_create_table
.. autofunction:: sql_drop_table
.. autofunction:: sql_define_column
.. autofunction:: sql_add_column
.. autofunction:: sql_drop_column
.. autofunction:: sql_add_unique_constraint
.. autofunction:: sql_add_foreign_key_constraint
.. autofunction:: sql_drop_constraint
.. autofunction:: sql_create_enum_type
.. autofunction:: sql_drop_type
.. autofunction:: sql_select
.. autofunction:: sql_insert
.. autofunction:: sql_update
.. autofunction:: sql_delete


