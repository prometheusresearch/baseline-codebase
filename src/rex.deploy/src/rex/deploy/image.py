#
# Copyright (c) 2013, Prometheus Research, LLC
#


import htsql.core.util
import weakref


class Image(object):
    """Mirrors a database object."""

    __slots__ = ('owner',)

    def __init__(self, owner):
        self.owner = owner

    def remove(self):
        """Removes the object from the catalog."""
        # Destroy all fields to release references and ensure the object
        # is never used again.
        for cls in self.__class__.__mro__:
            if hasattr(cls, '__slots__'):
                for slot in cls.__slots__:
                    if not (slot.startswith('__') and slot.endswith('__')):
                        delattr(self, slot)

    def __unicode__(self):
        raise NotImplementedError()

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, self)


class NamedImage(Image):
    """Database object with a name."""

    __slots__ = ('name',)

    max_name_length = 63

    def __init__(self, owner, name):
        assert isinstance(name, unicode) and len(name) <= self.max_name_length, \
                repr(name)
        super(NamedImage, self).__init__(owner)
        #: Object name.
        self.name = name

    def __unicode__(self):
        return self.name

    def rename(self, name):
        """Renames the object."""
        self.name = name


class ImageMap(object):
    """Ordered collection of named database objects."""

    __slots__ = ('_image_by_name', '_names')

    def __init__(self):
        self._image_by_name = {}
        self._names = []

    def __unicode__(self):
        return u"{%s}" % u", ".join(unicode(self._image_by_name[name])
                                    for name in self._names)

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, self)

    def __contains__(self, name):
        """Does the collection have an object with the given name?"""
        return (name in self._image_by_name)

    def __getitem__(self, name):
        """Finds an object by name."""
        return self._image_by_name[name]

    def __iter__(self):
        """Iterates over the elements of the collection."""
        return (self._image_by_name[name] for name in self._names)

    def __len__(self):
        """Number of elements in the collection."""
        return len(self._names)

    def __nonzero__(self):
        """Is the collection empty?"""
        return bool(self._names)

    def get(self, name, default=None):
        """Finds an object by name or returns ``default``."""
        return self._image_by_name.get(name, default)

    def index(self, name):
        """Returns the position of an object in the collection."""
        return self._names.index(name)

    def add(self, image):
        """Adds an object to the collection."""
        name = image.name
        if name in self._image_by_name:
            raise KeyError(name)
        self._image_by_name[name] = image
        self._names.append(name)

    def remove(self, image):
        """Removes an object from the collection."""
        name = image.name
        if name not in self._image_by_name:
            raise KeyError(name)
        assert self._image_by_name[name] is image, repr(image)
        del self._image_by_name[name]
        if name == self._names[-1]:
            self._names.pop()
        else:
            self._names.remove(name)

    def replace(self, name, image):
        """Replaces an object in the collection."""
        if name not in self._image_by_name:
            raise KeyError(name)
        index = self._names.index(name)
        del self._image_by_name[name]
        name = image.name
        if name in self._image_by_name:
            raise KeyError(name)
        self._image_by_name[name] = image
        self._names[index] = name

    def first(self):
        """Returns the first object in the collection."""
        if not self._names:
            raise KeyError()
        return self._image_by_name[self._names[0]]

    def last(self):
        """Returns the last object in the collection."""
        if not self._names:
            raise KeyError()
        return self._image_by_name[self._names[-1]]


class CatalogImage(Image):
    """Database catalog."""

    __slots__ = ('schemas', '__weakref__')

    def __init__(self):
        super(CatalogImage, self).__init__(weakref.ref(self))
        #: Collection of database schemas.
        self.schemas = ImageMap()

    def __unicode__(self):
        return u"."

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

    def get(self, name, default=None):
        """Finds a schema by name or returns ``default``."""
        return self.schemas.get(name, default)

    def remove(self):
        while self.schemas:
            self.schemas.last().remove()
        super(CatalogImage, self).remove()

    def add_schema(self, name):
        """Adds a new schema."""
        return SchemaImage(self, name)


class SchemaImage(NamedImage):
    """Database schema."""

    __slots__ = ('tables', 'types', '__weakref__')

    def __init__(self, catalog, name):
        super(SchemaImage, self).__init__(weakref.ref(catalog), name)
        #: Collection of tables in the schema.
        self.tables = ImageMap()
        #: Collection of types in the schema.
        self.types = ImageMap()
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

    def get(self, name, default=None):
        """Finds a table by name or returns ``default``."""
        return self.tables.get(name, default)

    def rename(self, name):
        old_name = self.name
        self.name = name
        self.catalog.schemas.replace(old_name, self)
        return self

    def remove(self):
        while self.tables:
            self.tables.last().remove()
        while self.types:
            self.types().last().remove()
        super(SchemaImage, self).remove()

    def add_table(self, name):
        """Adds a table."""
        return TableImage(self, name)

    def add_type(self, name):
        """Adds a type."""
        return TypeImage(self, name)

    def add_domain_type(self, name):
        """Adds a ``DOMAIN`` type."""
        return DomainTypeImage(self, name, base_type)

    def add_enum_type(self, name, labels):
        """Adds an ``ENUM`` type."""
        return EnumTypeImage(self, name, labels)


class TypeImage(NamedImage):
    """Type."""

    __slots__ = ()
    is_domain = False
    is_enum = False

    def __init__(self, schema, name):
        super(TypeImage, self).__init__(weakref.ref(schema), name)
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

    def rename(self, name):
        old_name = self.name
        self.name = name
        self.schema.types.replace(old_name, self)
        return self

    def remove(self):
        for column in self.columns:
            column.remove()
        for domain in self.domains:
            domain.remove()
        super(self, TypeImage).remove()


class DomainTypeImage(TypeImage):
    """Domain type."""

    __slots__ = ('base_type',)
    is_domain = True

    def __init__(self, schema, name, base_type):
        super(DomainTypeImage, self).__init__(schema, name)
        #: Wrapped type.
        self.base_type = base_type


class EnumTypeImage(TypeImage):
    """Enumeration type."""

    __slots__ = ('labels',)
    is_enum = True

    def __init__(self, schema, name, labels):
        super(EnumTypeImage, self).__init__(schema, name)
        #: List of labels.
        self.labels = labels


class TableImage(NamedImage):
    """Database table."""

    __slots__ = ('columns', 'constraints', 'primary_key', 'unique_keys',
                 'foreign_keys', 'referring_foreign_keys', 'data',
                 '__weakref__')

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
        #: Table rows.
        self.data = None
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

    def get(self, name, default=None):
        """Finds a table by name or returns ``default``."""
        return self.columns.get(name, default)

    def rename(self, name):
        old_name = self.name
        self.name = name
        self.schema.tables.replace(old_name, self)
        return self

    def remove(self):
        while self.constraints:
            self.constraints.last().remove()
        while self.columns:
            self.columns.last().remove()
        if self.data is not None:
            self.data.remove()
        super(TableImage, self).remove()

    def add_column(self, name, type, is_not_null):
        """Adds a new column to the table."""
        return ColumnImage(self, name, type, is_not_null)

    def add_constraint(self, name):
        """Adds a table constraint."""
        return ConstraintImage(self, name)

    def add_unique_key(self, name, columns, is_primary=False):
        """Adds a ``UNIQUE`` or ``PRIMARY KEY`` constraint."""
        return UniqueKeyImage(self, name, columns, is_primary)

    def add_primary_key(self, name, columns):
        """Adds a ``PRIMARY KEY`` constraint."""
        return UniqueKeyImage(self, name, columns, True)

    def add_foreign_key(self, name, columns, target, target_columns):
        """Adds a ``FOREIGN KEY`` constraint."""
        return ForeignKeyImage(self, name, columns, target, target_columns)

    def add_data(self, rows):
        """Adds table rows."""
        return DataImage(self, rows)


class ColumnImage(NamedImage):
    """Database column."""

    __slots__ = ('type', 'is_not_null', '__weakref__')

    def __init__(self, table, name, type, is_not_null):
        super(ColumnImage, self).__init__(weakref.ref(table), name)
        table.columns.add(self)
        #: Column type.
        self.type = type
        #: Has ``NOT NULL`` constraint?
        self.is_not_null = is_not_null
        if table.data is not None:
            table.data.remove()

    def __unicode__(self):
        return u"%s.%s" % (self.table, self.name)

    @property
    def table(self):
        """Column owner."""
        return self.owner()

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

    def rename(self, name):
        old_name = self.name
        self.name = name
        self.table.columns.replace(old_name, self)
        return self

    def set_type(self, type):
        """Sets new column type."""
        self.type = type
        return self

    def set_is_not_null(self, is_not_null):
        """Sets or unsets ``NOT NULL`` constraint."""
        self.is_not_null = is_not_null
        return self

    def remove(self):
        for unique_key in self.unique_keys[:]:
            unique_key.remove()
        for foreign_key in self.foreign_keys[:]:
            foreign_key.remove()
        for foreign_key in self.referring_foreign_keys[:]:
            foreign_key.remove()
        self.table.columns.remove(self)
        if self.table.data is not None:
            self.table.data.remove()
        super(ColumnImage, self).remove()


class ConstraintImage(NamedImage):
    """Table constraint."""

    __slots__ = ()

    def __init__(self, origin, name):
        super(ConstraintImage, self).__init__(weakref.ref(origin), name)
        origin.constraints.add(self)

    @property
    def origin(self):
        """Constraint owner."""
        return self.owner()

    def rename(self, name):
        old_name = self.name
        self.name = name
        self.origin.constraints.replace(old_name, self)
        return self

    def remove(self):
        self.table.constraints.remove(self)
        super(ConstraintImage, self).remove()


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
        if origin.data is not None:
            origin.data.remove()
        self.origin.unique_keys.remove(self)
        if self.is_primary:
            self.origin.primary_key = None
        super(UniqueKeyImage, self).remove()


class ForeignKeyImage(ConstraintImage):
    """Foreign key constraint."""

    __slots__ = ('origin_columns', 'coowner', 'target_columns')

    def __init__(self, origin, name, origin_columns, target, target_columns):
        super(ForeignKeyImage, self).__init__(origin, name)
        #: Key columns.
        self.origin_columns = origin_columns
        self.coowner = weakref.ref(target)
        #: Target key columns.
        self.target_columns = target_columns
        origin.foreign_keys.append(self)
        target.referring_foreign_keys.append(self)

    @property
    def target(self):
        """Target table."""
        return self.coowner()

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


class DataImage(Image):
    """Table rows."""

    __slots__ = ('masks', 'indexes')

    def __init__(self, table, rows):
        super(DataImage, self).__init__(weakref.ref(table))
        self.masks = {}
        self.indexes = {}
        for key in table.unique_keys:
            mask = tuple(table.columns.index(column.name) for column in key)
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


