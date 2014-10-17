******************
  Database image
******************

.. contents:: Table of Contents


Catalog image
=============

``rex.deploy`` provides API for representing structure and content of the
database.  To create a new database image, use function ``make_catalog()``::

    >>> from rex.deploy import make_catalog

    >>> catalog = make_catalog()
    >>> catalog
    <CatalogImage>

Initially, the catalog is empty::

    >>> catalog.schemas.first()
    Traceback (most recent call last):
      ...
    KeyError
    >>> catalog.schemas.last()
    Traceback (most recent call last):
      ...
    KeyError

You can new schemas to the catalog::

    >>> catalog.add_schema(u'pg_catalog')
    <SchemaImage pg_catalog>
    >>> catalog.add_schema(u'public')
    <SchemaImage public>

Two schemas cannot share the same name::

    >>> catalog.add_schema(u'public')
    Traceback (most recent call last):
      ...
    KeyError: u'public'

The catalog object supports some container operations::

    >>> u'public' in catalog
    True
    >>> u'private' in catalog
    False
    >>> catalog[u'public']
    <SchemaImage public>
    >>> catalog[u'private']
    Traceback (most recent call last):
      ...
    KeyError: u'private'
    >>> list(catalog)
    [<SchemaImage pg_catalog>, <SchemaImage public>]
    >>> len(catalog)
    2

More operations are available for ``catalog.schemas``, container object::

    >>> catalog.schemas
    <ImageMap {pg_catalog, public}>
    >>> catalog.schemas.first()
    <SchemaImage pg_catalog>
    >>> catalog.schemas.last()
    <SchemaImage public>


Schema images
=============

``SchemaImage`` object represents a database schema::

    >>> system_schema = catalog[u'pg_catalog']
    >>> public_schema = catalog[u'public']

You can add new tables to the schema::

    >>> public_schema.add_table(u'individual')
    <TableImage individual>
    >>> public_schema.add_table(u'sample')
    <TableImage sample>

You can also add new data types including ``ENUM``
and ``DOMAIN`` types::

    >>> system_schema.add_type(u'int4')
    <TypeImage int4>
    >>> system_schema.add_type(u'text')
    <TypeImage text>
    >>> public_schema.add_domain_type(u'name_t', system_schema.types[u'text'])
    <DomainTypeImage name_t <: text>
    >>> public_schema.add_enum_type(u'sex_enum', [u'male', u'female', u'unknown'])
    <EnumTypeImage sex_enum = male | female | unknown>

You can also add stored procedures and sequences::

    >>> trigger_type = system_schema.add_type(u'trigger')

    >>> public_schema.add_procedure(u'individual_pk', (), trigger_type,
    ...                             u'BEGIN NEW.sex := COALESCE(NEW.sex, \'unknown\'); END')
    <ProcedureImage individual_pk()>

    >>> public_schema.add_sequence(u'individual_seq')
    <SequenceImage individual_seq>

Schema objects support container operations::

    >>> u'individual' in public_schema
    True
    >>> public_schema[u'individual']
    <TableImage individual>
    >>> list(public_schema)
    [<TableImage individual>, <TableImage sample>]
    >>> len(public_schema)
    2


Table images
============

``TableImage`` represents a database table::

    >>> individual_table = public_schema[u'individual']
    >>> sample_table = public_schema[u'sample']

You can populate the tables with columns and constraints::

    >>> int4_type = system_schema.types[u'int4']
    >>> text_type = system_schema.types[u'text']
    >>> sex_enum_type = public_schema.types[u'sex_enum']

    >>> individual_table.add_column(u'id', int4_type, True)
    <ColumnImage individual.id : int4>
    >>> individual_table.add_column(u'code', text_type, True)
    <ColumnImage individual.code : text>
    >>> individual_table.add_column(u'sex', sex_enum_type, False)
    <ColumnImage individual.sex : sex_enum?>

    >>> individual_table.add_constraint(u'individual_code_ck')
    <ConstraintImage individual.individual_code_ck>
    >>> individual_table.add_unique_key(u'individual_id_uk', [individual_table[u'id']])
    <UniqueKeyImage individual.individual_id_uk (id)>
    >>> individual_table.add_primary_key(u'individual_pk', [individual_table[u'code']])
    <UniqueKeyImage individual.individual_pk (code)!>

    >>> sample_table.add_column(u'id', int4_type, True)
    <ColumnImage sample.id : int4>
    >>> sample_table.add_column(u'individual_id', int4_type, True)
    <ColumnImage sample.individual_id : int4>
    >>> sample_table.add_column(u'code', text_type, True)
    <ColumnImage sample.code : text>

    >>> sample_table.add_constraint(u'sample_code_ck')
    <ConstraintImage sample.sample_code_ck>
    >>> sample_table.add_unique_key(u'sample_id_uk', [sample_table[u'id']])
    <UniqueKeyImage sample.sample_id_uk (id)>
    >>> sample_table.add_primary_key(u'sample_pk',
    ...                              [sample_table[u'individual_id'], sample_table[u'code']])
    <UniqueKeyImage sample.sample_pk (individual_id, code)!>
    >>> sample_table.add_foreign_key(u'sample_individual_fk',
    ...                              [sample_table[u'individual_id']],
    ...                              individual_table, [individual_table[u'id']])
    <ForeignKeyImage sample.sample_individual_fk (individual_id) -> individual (id)>

You can add a trigger on a table::

    >>> individual_procedure = public_schema.procedures[u'individual_pk', ()]
    >>> individual_table.add_trigger(u'individual_pk', individual_procedure)
    <TriggerImage individual.individual_pk>

Table objects support container operations::

    >>> u'id' in individual_table
    True
    >>> individual_table[u'id']
    <ColumnImage individual.id : int4>
    >>> list(individual_table)              # doctest: +NORMALIZE_WHITESPACE
    [<ColumnImage individual.id : int4>,
     <ColumnImage individual.code : text>,
     <ColumnImage individual.sex : sex_enum?>]
    >>> len(individual_table)
    3


Type images
===========

``TypeImage`` represents a database type.  For each type, you can find
columns and subtypes::

    >>> int4_type.columns                   # doctest: +NORMALIZE_WHITESPACE
     [<ColumnImage individual.id : int4>,
      <ColumnImage sample.id : int4>,
      <ColumnImage sample.individual_id : int4>]

    >>> text_type.domains
    [<DomainTypeImage name_t <: text>]


Column images
=============

``ColumnImage`` represents a database column::

    >>> id_column = individual_table[u'id']
    >>> individual_id_column = sample_table[u'individual_id']

You can find constraints associated with a column::

    >>> id_column.unique_keys
    [<UniqueKeyImage individual.individual_id_uk (id)>]
    >>> id_column.foreign_keys
    []
    >>> id_column.referring_foreign_keys
    [<ForeignKeyImage sample.sample_individual_fk (individual_id) -> individual (id)>]

    >>> individual_id_column.unique_keys
    [<UniqueKeyImage sample.sample_pk (individual_id, code)!>]
    >>> individual_id_column.foreign_keys
    [<ForeignKeyImage sample.sample_individual_fk (individual_id) -> individual (id)>]
    >>> individual_id_column.referring_foreign_keys
    []

You can change properties of a column::

    >>> individual_table[u'sex']
    <ColumnImage individual.sex : sex_enum?>
    >>> individual_table[u'sex'].set_is_not_null(True).set_default('male')
    <ColumnImage individual.sex : sex_enum>


Constraints, indexes and triggers
=================================

``UniqueKeyImage`` and ``ForeignKeyImage`` represent database constraints::

    >>> sample_pk = sample_table.constraints[u'sample_pk']
    >>> sample_individual_fk = sample_table.constraints[u'sample_individual_fk']

A constraint usually has an associated index::

    >>> public_schema.add_index(sample_pk.name, sample_pk.origin, sample_pk.origin_columns)
    <IndexImage sample_pk>

For foreign key constraints, you can change the ``ON UPDATE`` and ``ON DELETE``
actions::

    >>> sample_individual_fk.set_on_update(u'RESTRICT').set_on_delete(u'RESTRICT')
    <ForeignKeyImage sample.sample_individual_fk (individual_id) -> individual (id)>

Constraint objects provide container interface::

    >>> individual_id_column in sample_pk
    True
    >>> sample_pk[0]
    <ColumnImage sample.individual_id : int4>
    >>> list(sample_pk)
    [<ColumnImage sample.individual_id : int4>, <ColumnImage sample.code : text>]
    >>> len(sample_pk)
    2

    >>> (individual_id_column, id_column) in sample_individual_fk
    True
    >>> sample_individual_fk[0]
    (<ColumnImage sample.individual_id : int4>, <ColumnImage individual.id : int4>)
    >>> list(sample_individual_fk)
    [(<ColumnImage sample.individual_id : int4>, <ColumnImage individual.id : int4>)]
    >>> len(sample_individual_fk)
    1

A table object also contains its triggers::

    >>> individual_trigger = individual_table.triggers[u'individual_pk']


Manipulating data
=================

You can specify the content of the table::

    >>> individual_table.add_data([
    ...     (1, '1001', 'male'),
    ...     (2, '1002', 'female'),
    ...     (3, '1003', None)])
    <DataImage individual>
    >>> sample_table.add_data([
    ...     (1, 3, '01'),
    ...     (2, 3, '02'),
    ...     (3, 3, '03')])
    <DataImage sample>

After that, you can find a table row by a key value::

    >>> individual_data = individual_table.data
    >>> individual_pk = individual_table.primary_key

    >>> individual_data.get(individual_pk, ('1001',))
    (1, '1001', 'male')
    >>> individual_data.get(individual_pk, ('1005',), 'NOT FOUND!')
    'NOT FOUND!'

You can add, modify and remove rows from a table::

    >>> individual_data.append_row((4, '1004', None))
    >>> individual_data.get(individual_pk, ('1004',))
    (4, '1004', None)

    >>> individual_data.replace_row((4, '1004', None), (4, '1004', 'female'))
    >>> individual_data.get(individual_pk, ('1004',))
    (4, '1004', 'female')

    >>> individual_data.replace_row((4, '1004', 'female'), (5, '1005', 'female'))
    >>> individual_data.get(individual_pk, ('1004',), 'NOT FOUND!')
    'NOT FOUND!'
    >>> individual_data.get(individual_pk, ('1005',))
    (5, '1005', 'female')

    >>> individual_data.remove_row((5, '1005', 'female'))
    >>> individual_data.get(individual_pk, ('1005',), 'NOT FOUND!')
    'NOT FOUND!'


Renaming and removing images
============================

All objects with a name could be renamed::

    >>> public_schema.set_name(u'private')
    <SchemaImage private>
    >>> sex_enum_type.set_name(u'gender')
    <EnumTypeImage gender = male | female | unknown>
    >>> individual_table.set_name(u'subject')
    <TableImage subject>
    >>> individual_id_column.set_name(u'subject_id')
    <ColumnImage sample.subject_id : int4>
    >>> individual_procedure.set_name(u'subject_pk')
    <ProcedureImage subject_pk()>
    >>> sample_individual_fk.set_name(u'sample_subject_fk')
    <ForeignKeyImage sample.sample_subject_fk (subject_id) -> subject (id)>
    >>> individual_trigger.set_name(u'subject_pk')
    <TriggerImage subject.subject_pk>

You can destroy individual types, columns, tables as well as the catalog object
itself::

    >>> text_type.remove()
    >>> sample_table.remove()
    >>> catalog.remove()


