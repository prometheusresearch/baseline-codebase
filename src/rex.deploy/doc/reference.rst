****************************
  REX.DEPLOY API Reference
****************************

.. contents:: Table of Contents

.. automodule:: rex.deploy


Facts
=====

.. autoclass:: Fact
   :special-members: __call__
.. autoclass:: TableFact
.. autoclass:: ColumnFact
.. autoclass:: LinkFact
.. autoclass:: AliasFact
.. autoclass:: IdentityFact
.. autoclass:: DataFact
.. autodata:: SKIP
.. autoclass:: Driver
   :special-members: __call__


Cluster management
==================

.. autoclass:: Cluster
.. autofunction:: get_cluster
.. autofunction:: deploy


Introspection and database catalog
==================================

.. autofunction:: introspect
.. autofunction:: make_catalog
.. autoclass:: Image
.. autoclass:: IndexedImage
.. autoclass:: NamedImage
.. autoclass:: ImageList
.. autoclass:: ImageMap
   :special-members: __contains__, __getitem__, __iter__, __len__, __nonzero__
.. autoclass:: CatalogImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: SchemaImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: NamespacedImage
.. autoclass:: TypeImage
.. autoclass:: DomainTypeImage
.. autoclass:: EnumTypeImage
.. autoclass:: SequenceImage
.. autoclass:: ProcedureImage
.. autoclass:: TableImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: ColumnImage
.. autoclass:: ConstraintImage
.. autoclass:: UniqueKeyImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: ForeignKeyImage
   :special-members: __contains__, __getitem__, __iter__, __len__
.. autoclass:: IndexImage
.. autoclass:: TriggerImage
.. autoclass:: DataImage


Entity metadata
===============

.. autofunction:: label_to_title
.. autofunction:: uncomment
.. autoclass:: Meta
.. autoclass:: TableMeta
.. autoclass:: ColumnMeta
.. autoclass:: PrimaryKeyMeta


Entity objects
==============

.. autofunction:: model
.. autoclass:: Model
.. autoclass:: ModelSchema
.. autoclass:: TableModel
.. autoclass:: ColumnModel
.. autoclass:: LinkModel
.. autoclass:: IdentityModel


SQL serialization
=================

.. autofunction:: mangle
.. autofunction:: sql_name
.. autofunction:: sql_qname
.. autofunction:: sql_value
.. autofunction:: sql_render
.. autofunction:: sql_template


