#
# Copyright (c) 2013, Prometheus Research, LLC
#


import htsql.core.util
import collections
import weakref


class Image(object):
    """Mirrors a database object."""

    __slots__ = ('owner',)

    def __init__(self, owner):
        self.owner = owner

    def __repr__(self):
        return "<%s>" % self.__class__.__name__

    def remove(self):
        """Removes the object from the catalog."""
        # Destroy all fields to release references and ensure the object
        # is never used again.
        for cls in self.__class__.__mro__:
            if hasattr(cls, '__slots__'):
                for slot in cls.__slots__:
                    if not (slot.startswith('__') and slot.endswith('__')):
                        delattr(self, slot)


class IndexedImage(Image):
    """Database object indexed by some key."""

    __slots__ = ('handle',)

    def __init__(self, owner, handle):
        super(IndexedImage, self).__init__(owner)
        #: Object key.
        self.handle = handle

    def __str__(self):
        return str(self.handle)

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, self)


class NamedImage(IndexedImage):
    """Database object with a name."""

    __slots__ = ('name',)

    max_name_length = 63

    def __init__(self, owner, name):
        assert isinstance(name, unicode) and len(name) <= self.max_name_length, \
                repr(name)
        super(NamedImage, self).__init__(owner, name)
        #: Object name.
        self.name = name

    def __str__(self):
        return self.name.encode('utf-8')

    def rename(self, name):
        """Renames the object."""
        self.handle = self.name = name
        return self


class ImageMap(object):
    """Ordered collection of indexed database objects."""

    __slots__ = ('_images')

    def __init__(self):
        self._images = collections.OrderedDict()

    def __str__(self):
        return "{%s}" % ", ".join(str(image)
                                  for image in self._images.values())

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, self)

    def __contains__(self, handle):
        """Does the collection have an object with the given handle?"""
        return (handle in self._images)

    def __getitem__(self, handle):
        """Finds an object by handle."""
        return self._images[handle]

    def __iter__(self):
        """Iterates over the elements of the collection."""
        return self._images.itervalues()

    def __len__(self):
        """Number of elements in the collection."""
        return len(self._images)

    def __nonzero__(self):
        """Is the collection empty?"""
        return bool(self._images)

    def get(self, handle, default=None):
        """Finds an object by handle, returns default value if not found."""
        return self._images.get(handle, default)

    def keys(self):
        """Gets the list of handles."""
        return self._images.keys()

    def add(self, image):
        """Adds an object to the collection."""
        handle = image.handle
        if handle in self._images:
            raise KeyError(handle)
        self._images[handle] = image

    def remove(self, image):
        """Removes an object from the collection."""
        handle = image.handle
        if handle not in self._images:
            raise KeyError(handle)
        assert self._images[handle] is image, repr(image)
        del self._images[handle]

    def replace(self, handle, image):
        """Replaces an object in the collection."""
        if handle not in self._images:
            raise KeyError(handle)
        del self._images[handle]
        self._images[image.handle] = image

    def first(self):
        """Returns the first object in the collection."""
        if not self._images:
            raise KeyError()
        handle = next(iter(self._images))
        return self._images[handle]

    def last(self):
        """Returns the last object in the collection."""
        if not self._images:
            raise KeyError()
        handle = next(reversed(self._images))
        return self._images[handle]


class CatalogImage(Image):
    """Database catalog."""

    __slots__ = ('schemas', '__weakref__')

    def __init__(self):
        super(CatalogImage, self).__init__(weakref.ref(self))
        #: Collection of database schemas.
        self.schemas = ImageMap()

    def __contains__(self, name):
        """Is there a schema with the given name?"""
        return (name in self.schemas)

    def __getitem__(self, name):
        """Finds a schema by name."""
        return self.schemas[name]

    def __iter__(self):
        """Iterates over schemas."""
        return iter(self.schemas)

    def __len__(self):
        """Number of schemas."""
        return len(self.schemas)

    def remove(self):
        while self.schemas:
            self.schemas.last().remove()
        super(CatalogImage, self).remove()

    def add_schema(self, name):
        """Adds a new schema."""
        return SchemaImage(self, name)


class SchemaImage(NamedImage):
    """Database schema."""

    __slots__ = ('tables', 'indexes', 'sequences',
                 'types', 'procedures', 'comment', '__weakref__')

    def __init__(self, catalog, name):
        super(SchemaImage, self).__init__(weakref.ref(catalog), name)
        #: Collection of tables in the schema.
        self.tables = ImageMap()
        #: Collection of table indexes (share table namespace).
        self.indexes = ImageMap()
        #: Collection of sequence objects (share table namespace).
        self.sequences = ImageMap()
        #: Collection of types in the schema.
        self.types = ImageMap()
        #: Collections of procedures in the schema.
        self.procedures = ImageMap()
        #: Schema comment.
        self.comment = None
        catalog.schemas.add(self)

    @property
    def catalog(self):
        """Schema owner."""
        return self.owner()

    def __contains__(self, name):
        """Is there a table with the given name?"""
        return (name in self.tables)

    def __getitem__(self, name):
        """Finds a tables by name."""
        return self.tables[name]

    def __iter__(self):
        """Iterates over tables."""
        return iter(self.tables)

    def __len__(self):
        """Number of tables."""
        return len(self.tables)

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.catalog.schemas.replace(old_name, self)
        return self

    def remove(self):
        while self.tables:
            self.tables.last().remove()
        while self.indexes:
            self.indexes.last().remove()
        while self.sequences:
            self.sequences.last().remove()
        while self.procedures:
            self.procedures.last().remove()
        while self.types:
            self.types.last().remove()
        self.catalog.schemas.remove(self)
        super(SchemaImage, self).remove()

    def add_table(self, name):
        """Adds a table."""
        return TableImage(self, name)

    def add_index(self, name, table, columns):
        """Adds an index."""
        return IndexImage(self, name, table, columns)

    def add_sequence(self, name):
        """Adds a sequence."""
        return SequenceImage(self, name)

    def add_type(self, name):
        """Adds a type."""
        return TypeImage(self, name)

    def add_domain_type(self, name, base_type):
        """Adds a ``DOMAIN`` type."""
        return DomainTypeImage(self, name, base_type)

    def add_enum_type(self, name, labels):
        """Adds an ``ENUM`` type."""
        return EnumTypeImage(self, name, labels)

    def add_procedure(self, name, types, return_type, body):
        """Adds a stored procedure."""
        return ProcedureImage(self, name, types, return_type, body)

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class IndexImage(NamedImage):
    """Index."""

    __slots__ = ('table', 'columns', 'comment')

    def __init__(self, schema, name, table, columns):
        super(IndexImage, self).__init__(weakref.ref(schema), name)
        #: Indexed table.
        self.table = table
        #: Indexed columns.
        self.columns = columns
        #: Index comment.
        self.comment = None
        schema.indexes.add(self)

    @property
    def schema(self):
        """Index owner."""
        return self.owner()

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.schema.indexes.replace(old_name, self)
        return self

    def remove(self):
        self.schema.indexes.remove(self)
        super(IndexImage, self).remove()

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class SequenceImage(NamedImage):
    """Sequence."""

    __slots__ = ('comment',)

    def __init__(self, schema, name):
        super(SequenceImage, self).__init__(weakref.ref(schema), name)
        self.comment = None
        schema.sequences.add(self)

    @property
    def schema(self):
        """Sequence owner."""
        return self.owner()

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.schema.sequences.replace(old_name, self)
        return self

    def remove(self):
        self.schema.sequences.remove(self)
        super(SequenceImage, self).remove()

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class TypeImage(NamedImage):
    """Type."""

    __slots__ = ('comment',)
    is_domain = False
    is_enum = False

    def __init__(self, schema, name):
        super(TypeImage, self).__init__(weakref.ref(schema), name)
        #: Type comment.
        self.comment = None
        schema.types.add(self)

    @property
    def schema(self):
        """Type owner."""
        return self.owner()

    @property
    def columns(self):
        """List of existing columns of this type."""
        # FIXME? expensive.
        return [column for schema in self.schema.catalog
                       for table in schema
                       for column in table
                       if column.type is self]

    @property
    def domains(self):
        """List of domains that wrap this type."""
        # FIXME? expensive.
        return [type for schema in self.schema.catalog
                     for type in schema.types
                     if isinstance(type, DomainTypeImage) and
                        type.base_type is self]

    @property
    def procedures(self):
        """List of procedures that use this type."""
        # FIXME? expensive.
        return [procedure for schema in self.schema.catalog
                          for procedure in schema.procedures
                          if self in procedure.types or
                             self is procedure.return_type]

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.schema.types.replace(old_name, self)
        return self

    def remove(self):
        for column in self.columns:
            column.remove()
        for domain in self.domains:
            domain.remove()
        for procedure in self.procedures:
            procedure.remove()
        self.schema.types.remove(self)
        super(TypeImage, self).remove()

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class DomainTypeImage(TypeImage):
    """Domain type."""

    __slots__ = ('base_type',)
    is_domain = True

    def __init__(self, schema, name, base_type):
        super(DomainTypeImage, self).__init__(schema, name)
        #: Wrapped type.
        self.base_type = base_type

    def __repr__(self):
        return "<%s %s <: %s>" % (self.__class__.__name__, self, self.base_type)


class EnumTypeImage(TypeImage):
    """Enumeration type."""

    __slots__ = ('labels',)
    is_enum = True

    def __init__(self, schema, name, labels):
        super(EnumTypeImage, self).__init__(schema, name)
        #: List of labels.
        self.labels = labels

    def __repr__(self):
        return "<%s %s = %s>" % (self.__class__.__name__,
                                 self, " | ".join(self.labels))


class ProcedureSignature(
        collections.namedtuple('ProcedureSignature', ['name', 'types'])):

    __slots__ = ()

    def __str__(self):
        return "%s(%s)" % (self.name.encode('utf-8'),
                           ", ".join(str(type) for type in self.types))


class ProcedureImage(IndexedImage):
    """Stored procedure."""

    __slots__ = ('name', 'types', 'return_type', 'source', 'comment')

    def __init__(self, schema, name, types, return_type, source):
        signature = ProcedureSignature(name, types)
        super(ProcedureImage, self).__init__(weakref.ref(schema), signature)
        #: Procedure name.
        self.name = name
        #: Types of procedure arguments.
        self.types = types
        #: Type of the return value.
        self.return_type = return_type
        #: Procedure body.
        self.source = source
        #: Comment on the procedure.
        self.comment = None
        schema.procedures.add(self)

    @property
    def schema(self):
        """Procedure owner."""
        return self.owner()

    @property
    def triggers(self):
        """List of triggers that call this procedure."""
        # FIXME? expensive.
        return [trigger for schema in self.schema.catalog
                        for table in schema.tables
                        for trigger in table.triggers
                        if self is trigger.procedure]

    def rename(self, name):
        old_handle = self.handle
        self.handle = ProcedureSignature(name, self.types)
        self.name = name
        self.schema.procedures.replace(old_handle, self)
        return self

    def remove(self):
        for trigger in self.triggers:
            trigger.remove()
        self.schema.procedures.remove(self)
        super(ProcedureImage, self).remove()

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class TableImage(NamedImage):
    """Database table."""

    __slots__ = ('columns', 'constraints', 'primary_key', 'unique_keys',
                 'foreign_keys', 'referring_foreign_keys', 'triggers',
                 'data', 'comment', 'is_unlogged', '__weakref__')

    def __init__(self, schema, name):
        super(TableImage, self).__init__(weakref.ref(schema), name)
        #: Collection of table columns.
        self.columns = ImageMap()
        #: Collection of table constraints.
        self.constraints = ImageMap()
        #: Primary key constraint.
        self.primary_key = None
        #: List of unique constraints.
        self.unique_keys = []
        #: List of foreign keys owned by the table.
        self.foreign_keys = []
        #: List of foreign keys referring to the table.
        self.referring_foreign_keys = []
        #: Collection of triggers.
        self.triggers = ImageMap()
        #: Table rows.
        self.data = None
        #: Table comment.
        self.comment = None
        #: The table was created as `UNLOGGED`?
        self.is_unlogged = False
        schema.tables.add(self)

    @property
    def schema(self):
        """Table owner."""
        return self.owner()

    def __contains__(self, name):
        """Is there a column with the given name?"""
        return (name in self.columns)

    def __getitem__(self, name):
        """Finds a column by name."""
        return self.columns[name]

    def __iter__(self):
        """Iterates over columns."""
        return iter(self.columns)

    def __len__(self):
        """Number of columns."""
        return len(self.columns)

    @property
    def indexes(self):
        """List of all indexes that cover the table."""
        catalog = self.schema.catalog
        return [index
                for schema in catalog.schemas
                for index in schema.indexes
                if self is index.table]

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.schema.tables.replace(old_name, self)
        return self

    def remove(self):
        while self.triggers:
            self.triggers.last().remove()
        while self.constraints:
            self.constraints.last().remove()
        while self.columns:
            self.columns.last().remove()
        if self.data is not None:
            self.data.remove()
        self.schema.tables.remove(self)
        super(TableImage, self).remove()

    def add_column(self, name, type, is_not_null, default=None):
        """Adds a new column to the table."""
        return ColumnImage(self, name, type, is_not_null, default)

    def add_constraint(self, name):
        """Adds a table constraint."""
        return ConstraintImage(self, name)

    def add_unique_key(self, name, columns, is_primary=False):
        """Adds a ``UNIQUE`` or ``PRIMARY KEY`` constraint."""
        return UniqueKeyImage(self, name, columns, is_primary)

    def add_primary_key(self, name, columns):
        """Adds a ``PRIMARY KEY`` constraint."""
        return UniqueKeyImage(self, name, columns, True)

    def add_foreign_key(self, name, columns, target, target_columns,
                        on_update=None, on_delete=None):
        """Adds a ``FOREIGN KEY`` constraint."""
        return ForeignKeyImage(self, name, columns, target, target_columns,
                               on_update=on_update, on_delete=on_delete)

    def add_trigger(self, name, procedure):
        """Add a table trigger."""
        return TriggerImage(self, name, procedure)

    def add_data(self, rows):
        """Adds table rows."""
        return DataImage(self, rows)

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self

    def set_is_unlogged(self, is_unlogged):
        """Sets or unsets ``UNLOGGED`` property."""
        self.is_unlogged = is_unlogged
        return self


class ColumnImage(NamedImage):
    """Database column."""

    __slots__ = ('type', 'is_not_null', 'default', 'comment')

    def __init__(self, table, name, type, is_not_null, default=None):
        super(ColumnImage, self).__init__(weakref.ref(table), name)
        table.columns.add(self)
        #: Column type.
        self.type = type
        #: Has ``NOT NULL`` constraint?
        self.is_not_null = is_not_null
        #: Default column value.
        self.default = default
        #: Column comment.
        self.comment = None
        if table.data is not None:
            table.data.remove()

    @property
    def table(self):
        """Column owner."""
        return self.owner()

    def __repr__(self):
        return "<%s %s.%s : %s%s>" % (self.__class__.__name__,
                                      self.table, self,
                                      self.type,
                                      "?" if not self.is_not_null else "")

    @property
    def unique_keys(self):
        """List of unique keys that include the column."""
        return [unique_key
                for unique_key in self.table.unique_keys
                if self in unique_key.origin_columns]

    @property
    def foreign_keys(self):
        """List of foreign keys that include the column."""
        return [foreign_key
                for foreign_key in self.table.foreign_keys
                if self in foreign_key.origin_columns]

    @property
    def referring_foreign_keys(self):
        """List of foreign keys that refer to the column."""
        return [foreign_key
                for foreign_key in self.table.referring_foreign_keys
                if self in foreign_key.target_columns]

    @property
    def indexes(self):
        """List of all indexes that cover the column."""
        catalog = self.table.schema.catalog
        return [index
                for schema in catalog.schemas
                for index in schema.indexes
                if self in index.columns]

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.table.columns.replace(old_name, self)
        return self

    def remove(self):
        for unique_key in self.unique_keys[:]:
            unique_key.remove()
        for foreign_key in self.foreign_keys[:]:
            foreign_key.remove()
        for foreign_key in self.referring_foreign_keys[:]:
            foreign_key.remove()
        for index in self.indexes[:]:
            index.remove()
        if self.table.data is not None:
            self.table.data.remove()
        self.table.columns.remove(self)
        super(ColumnImage, self).remove()

    def set_type(self, type):
        """Sets new column type."""
        self.type = type
        return self

    def set_is_not_null(self, is_not_null):
        """Sets or unsets ``NOT NULL`` constraint."""
        self.is_not_null = is_not_null
        return self

    def set_default(self, default):
        """Sets the default value expression."""
        self.default = default
        return self

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class ConstraintImage(NamedImage):
    """Table constraint."""

    __slots__ = ('comment',)

    def __init__(self, origin, name):
        super(ConstraintImage, self).__init__(weakref.ref(origin), name)
        #: Constraint comment.
        self.comment = None
        origin.constraints.add(self)

    @property
    def origin(self):
        """Constraint owner."""
        return self.owner()

    def __repr__(self):
        return "<%s %s.%s>" % (self.__class__.__name__, self.origin, self)

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.origin.constraints.replace(old_name, self)
        return self

    def remove(self):
        self.origin.constraints.remove(self)
        super(ConstraintImage, self).remove()

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class UniqueKeyImage(ConstraintImage):
    """``UNIQUE``/``PRIMARY KEY`` constraint."""

    __slots__ = ('origin_columns', 'is_primary')

    def __init__(self, origin, name, origin_columns, is_primary):
        super(UniqueKeyImage, self).__init__(origin, name)
        #: Key columns.
        self.origin_columns = origin_columns
        #: ``UNIQUE`` or ``PRIMARY KEY``
        self.is_primary = is_primary
        if is_primary:
            assert origin.primary_key is None
            origin.primary_key = self
        origin.unique_keys.append(self)
        if origin.data is not None:
            origin.data.remove()

    def __repr__(self):
        origin_list = ", ".join(str(column) for column in self.origin_columns)
        return "<%s %s.%s (%s)%s>" % (self.__class__.__name__,
                                      self.origin, self,
                                      origin_list,
                                      "!" if self.is_primary else "")

    def __contains__(self, column):
        """Does the column belong to the key?"""
        return (column in self.origin_columns)

    def __getitem__(self, index):
        """Returns a column by index."""
        return self.origin_columns[index]

    def __iter__(self):
        """Iterates over key columns."""
        return iter(self.origin_columns)

    def __len__(self):
        """Number of columns in the key."""
        return len(self.origin_columns)

    def remove(self):
        if self.origin.data is not None:
            self.origin.data.remove()
        self.origin.unique_keys.remove(self)
        if self.is_primary:
            self.origin.primary_key = None
        super(UniqueKeyImage, self).remove()


NO_ACTION = u'NO ACTION'
RESTRICT = u'RESTRICT'
CASCADE = u'CASCADE'
SET_NULL = u'SET NULL'
SET_DEFAULT = u'SET DEFAULT'


class ForeignKeyImage(ConstraintImage):
    """Foreign key constraint."""

    __slots__ = ('origin_columns', 'coowner', 'target_columns',
                 'on_update', 'on_delete')

    def __init__(self, origin, name, origin_columns, target, target_columns,
                 on_update=None, on_delete=None):
        super(ForeignKeyImage, self).__init__(origin, name)
        #: Key columns.
        self.origin_columns = origin_columns
        self.coowner = weakref.ref(target)
        #: Target key columns.
        self.target_columns = target_columns
        #: Action to perform when the referenced column is updated.
        self.on_update = on_update or NO_ACTION
        #: Action to perform when the referenced row is deleted.
        self.on_delete = on_delete or NO_ACTION
        origin.foreign_keys.append(self)
        target.referring_foreign_keys.append(self)

    @property
    def target(self):
        """Target table."""
        return self.coowner()

    def __repr__(self):
        origin_list = ", ".join(str(column) for column in self.origin_columns)
        target_list = ", ".join(str(column) for column in self.target_columns)
        return "<%s %s.%s (%s) -> %s (%s)>" \
                % (self.__class__.__name__,
                   self.origin, self, origin_list,
                   self.target, target_list)

    def __contains__(self, column_pair):
        """Does a pair of columns belong to the key?"""
        return (column_pair in zip(self.origin_columns, self.target_columns))

    def __getitem__(self, index):
        """Returns a column pair by index."""
        return (self.origin_columns[index], self.target_columns[index])

    def __iter__(self):
        """Iterates over column pairs."""
        return iter(zip(self.origin_columns, self.target_columns))

    def __len__(self):
        """Number of columns in the key."""
        return len(self.origin_columns)

    def remove(self):
        self.origin.foreign_keys.remove(self)
        self.target.referring_foreign_keys.remove(self)
        super(ForeignKeyImage, self).remove()

    def set_on_update(self, action):
        """Sets ``ON UPDATE`` action."""
        self.on_update = action
        return self

    def set_on_delete(self, action):
        """Sets ``ON DELETE`` action."""
        self.on_delete = action
        return self


class TriggerImage(NamedImage):
    """Table trigger."""

    __slots__ = ('procedure', 'comment')

    def __init__(self, table, name, procedure):
        super(TriggerImage, self).__init__(weakref.ref(table), name)
        #: Procedure to call.
        self.procedure = procedure
        #: Comment on the trigger.
        self.comment = None
        table.triggers.add(self)

    @property
    def table(self):
        """Trigger owner."""
        return self.owner()

    def __repr__(self):
        return "<%s %s.%s>" % (self.__class__.__name__, self.table, self)

    def rename(self, name):
        old_name = self.name
        self.handle = self.name = name
        self.table.triggers.replace(old_name, self)
        return self

    def remove(self):
        self.table.triggers.remove(self)
        super(TriggerImage, self).remove()

    def set_comment(self, text):
        """Sets the comment."""
        self.comment = text
        return self


class DataImage(Image):
    """Table rows."""

    __slots__ = ('masks', 'indexes')

    def __init__(self, table, rows):
        super(DataImage, self).__init__(weakref.ref(table))
        self.masks = {}
        self.indexes = {}
        for key in table.unique_keys:
            names = table.columns.keys()
            mask = tuple(names.index(column.name) for column in key)
            index = {}
            for row in rows:
                handle = tuple(row[idx] for idx in mask)
                if None not in handle:
                    index[handle] = row
            self.masks[key] = mask
            self.indexes[key] = index
        table.data = self

    @property
    def table(self):
        """Table."""
        return self.owner()

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, self.table)

    def remove(self):
        self.table.data = None
        super(DataImage, self).remove()

    def insert(self, new_row):
        """Adds a new row."""
        for key in self.table.unique_keys:
            mask = self.masks[key]
            index = self.indexes[key]
            handle = tuple(new_row[idx] for idx in mask)
            if None not in handle:
                index[handle] = new_row

    def update(self, old_row, new_row):
        """Replaces a row."""
        for key in self.table.unique_keys:
            mask = self.masks[key]
            index = self.indexes[key]
            old_handle = tuple(old_row[idx] for idx in mask)
            if None not in old_handle:
                del index[old_handle]
            new_handle = tuple(new_row[idx] for idx in mask)
            if None not in new_handle:
                index[new_handle] = new_row

    def delete(self, old_row):
        """Removes a row."""
        for key in self.table.unique_keys:
            mask = self.masks[key]
            index = self.indexes[key]
            handle = tuple(old_row[idx] for idx in mask)
            if None not in handle:
                del index[handle]

    def get(self, key, handle, default=None):
        """Finds a row by a key."""
        return self.indexes[key].get(handle, default)


def make_catalog():
    """Creates an empty catalog image."""
    return CatalogImage()


