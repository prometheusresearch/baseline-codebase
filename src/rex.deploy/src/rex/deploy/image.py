#
# Copyright (c) 2013, Prometheus Research, LLC
#


from .sql import (sql_create_schema, sql_drop_schema, sql_rename_schema,
        sql_create_extension, sql_drop_extension, sql_comment_on_schema,
        sql_create_table, sql_drop_table, sql_rename_table,
        sql_create_view, sql_drop_view, sql_rename_view, sql_comment_on_view,
        sql_comment_on_table, sql_define_column, sql_add_column,
        sql_drop_column, sql_rename_column, sql_copy_column,
        sql_set_column_type, sql_set_column_not_null, sql_set_column_default,
        sql_comment_on_column, sql_create_enum_type, sql_drop_type,
        sql_rename_type, sql_add_unique_constraint,
        sql_add_foreign_key_constraint, sql_drop_constraint,
        sql_rename_constraint, sql_comment_on_constraint, sql_create_index,
        sql_drop_index, sql_rename_index, sql_create_sequence,
        sql_rename_sequence, sql_nextval, sql_create_function,
        sql_drop_function, sql_rename_function, sql_create_trigger,
        sql_drop_trigger, sql_rename_trigger, sql_comment_on_trigger,
        sql_select, sql_insert, sql_update, sql_delete)
import htsql.core.util
import collections
import weakref


class Image:
    """Mirrors a database object."""

    __slots__ = ('owner', 'cursor', 'linkages', 'containers', '__weakref__')

    def __init__(self, owner, cursor=None):
        self.owner = weakref.ref(owner)
        self.cursor = cursor or owner.cursor
        self.linkages = []
        self.containers = []

    def __bool__(self):
        # Is the image alive?
        return hasattr(self, 'owner')

    def __repr__(self):
        return "<%s>" % self.__class__.__name__

    def link(self, other):
        """Links a dependent object."""
        self.linkages.append(weakref.ref(other))

    def unlink(self, other):
        """Unlinks a dependent object."""
        self.linkages.remove(weakref.ref(other))

    def find(self, types):
        """Finds dependent objects of the given type or types."""
        result = []
        for linkage in self.linkages:
            image = linkage()
            if image and isinstance(image, types):
                result.append(image)
        return result

    def place(self, collection):
        """Adds the image to a collection."""
        collection.add(self)
        self.containers.append(weakref.ref(collection))

    def remove(self):
        """Removes the object from the catalog."""
        # Remove dependent objects.
        for linkage in self.linkages:
            image = linkage()
            if image:
                image.remove()
        # Remove the object from all collections.
        for container in self.containers:
            collection = container()
            if collection:
                collection.remove(self)
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

    def set_handle(self, handle):
        """Sets the image handle."""
        old_handle = self.handle
        self.handle = handle
        for container in self.containers:
            collection = container()
            if collection:
                collection.replace(old_handle, self)
        return self


class NamedImage(IndexedImage):
    """Database object with a name."""

    __slots__ = ('name',)

    max_name_length = 63

    def __init__(self, owner, name):
        assert isinstance(name, str) and len(name) <= self.max_name_length, \
                repr(name)
        super(NamedImage, self).__init__(owner, name)
        #: Object name.
        self.name = name

    def __str__(self):
        return self.name

    def set_name(self, name):
        """Renames the object."""
        self.name = name
        return self.set_handle(name)


class ImageList(list):
    """List of database objects."""

    __slots__ = ('__weakref__',)

    def add(self, image):
        """Adds an object to the list."""
        self.append(image)

    def replace(self, handle, image):
        """Replaces an object in the list."""
        pass


class ImageMap:
    """Ordered collection of indexed database objects."""

    __slots__ = ('_images', '__weakref__')

    def __init__(self):
        self._images = collections.OrderedDict()

    def __str__(self):
        return "{%s}" % ", ".join(str(image)
                                  for image in list(self._images.values()))

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
        return iter(self._images.values())

    def __len__(self):
        """Number of elements in the collection."""
        return len(self._images)

    def __bool__(self):
        """Is the collection empty?"""
        return bool(self._images)

    def get(self, handle, default=None):
        """Finds an object by handle, returns default value if not found."""
        return self._images.get(handle, default)

    def keys(self):
        """Gets the list of handles."""
        return list(self._images.keys())

    def values(self):
        """Gets the list of images."""
        return list(self._images.values())

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

    __slots__ = ('schemas', 'extensions')

    def __init__(self, cursor):
        super(CatalogImage, self).__init__(self, cursor)
        #: Collection of database schemas.
        self.schemas = ImageMap()
        #: Collection of extensions.
        self.extensions = ImageMap()

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

    def add_schema(self, name):
        """Adds a new schema."""
        return SchemaImage(self, name)

    def add_extension(self, name):
        """Adds a new extension."""
        return ExtensionImage(self, name)

    def create_schema(self, name):
        """Creates a new schema."""
        sql = sql_create_schema(name)
        self.cursor.execute(sql)
        return self.add_schema(name)

    def create_extension(self, name):
        """Creates a new extension."""
        sql = sql_create_extension(name)
        self.cursor.execute(sql)
        return self.add_extension(name)


class SchemaImage(NamedImage):
    """Database schema."""

    __slots__ = ('tables', 'indexes', 'sequences',
                 'types', 'procedures', 'comment')

    def __init__(self, catalog, name):
        super(SchemaImage, self).__init__(catalog, name)
        self.place(catalog.schemas)
        catalog.link(self)
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

    def add_table(self, name, is_unlogged=False):
        """Adds a table."""
        return TableImage(self, name, is_unlogged=is_unlogged)

    def add_view(self, name, definition):
        """Adds a view."""
        return ViewImage(self, name, definition)

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

    def add_procedure(self, name, types, return_type, source):
        """Adds a stored procedure."""
        return ProcedureImage(self, name, types, return_type, source)

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def create_table(self, name, definitions, is_unlogged=False):
        """Creates a table with the given columns."""
        qname = (self.name, name)
        body = [sql_define_column(column_name, type.qname, is_not_null, default)
                for column_name, type, is_not_null, default in definitions]
        sql = sql_create_table(qname, body, is_unlogged=is_unlogged)
        self.cursor.execute(sql)
        table = self.add_table(name, is_unlogged=is_unlogged)
        for column_name, type, is_not_null, default in definitions:
            table.add_column(column_name, type, is_not_null, default)
        return table

    def create_view(self, name, definition):
        """Creates a view with the given definition."""
        qname = (self.name, name)
        sql = sql_create_view(qname, definition)
        self.cursor.execute(sql)
        view = self.add_view(name, definition=definition)
        return view

    def create_index(self, name, table, columns):
        """Creates an index."""
        column_names = [column.name for column in columns]
        sql = sql_create_index(name, table.qname, column_names)
        self.cursor.execute(sql)
        return self.add_index(name, table, columns)

    def create_sequence(self, name, column=None):
        """Creates a sequence and associates it with a column."""
        qname = (self.name, name)
        if column is None:
            self.cursor.execute(sql_create_sequence(qname))
            return self.add_sequence(qname)
        sql = sql_create_sequence(qname, column.table.qname, column.name)
        self.cursor.execute(sql)
        column.alter_default(sql_nextval(qname))
        sequence = self.add_sequence(name)
        column.link(sequence)
        return sequence

    def create_enum_type(self, name, labels):
        """Creates a ``ENUM`` type."""
        qname = (self.name, name)
        sql = sql_create_enum_type(qname, labels)
        self.cursor.execute(sql)
        return self.add_enum_type(name, labels)

    def create_procedure(self, name, types, return_type, source):
        """Creates a stored procedure."""
        qname = (self.name, name)
        type_qnames = [type.qname for type in types]
        sql = sql_create_function(
                qname, type_qnames, return_type.qname, "plpgsql", source)
        self.cursor.execute(sql)
        return self.add_procedure(name, types, return_type, source)

    def alter_name(self, name):
        """Renames the schema."""
        if self.name == name:
            return self
        sql = sql_rename_schema(self.name, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def alter_comment(self, comment):
        """Updates the schema comment."""
        if self.comment == comment:
            return self
        sql = sql_comment_on_schema(self.name, comment)
        self.cursor.execute(sql)
        return self.set_comment(comment)

    def drop(self):
        """Deletes the schema."""
        sql = sql_drop_schema(self.name)
        self.cursor.execute(sql)
        self.remove()


class ExtensionImage(NamedImage):
    """Database extension."""

    __slots__ = ()

    def __init__(self, catalog, name):
        super(ExtensionImage, self).__init__(catalog, name)
        self.place(catalog.extensions)
        catalog.link(self)

    @property
    def catalog(self):
        """Schema owner."""
        return self.owner()

    def drop(self):
        """Deletes the extension."""
        sql = sql_drop_extension(self.name)
        self.cursor.execute(sql)
        self.remove()


class NamespacedImage(NamedImage):
    """Named object that belongs to a schema."""

    __slots__ = ()

    @property
    def schema(self):
        """The schema that owns the object."""
        return self.owner()

    @property
    def qname(self):
        """
        The qualified name.
        """
        return (self.owner().name, self.name)


class IndexImage(NamespacedImage):
    """Index."""

    __slots__ = ('table', 'columns', 'comment')

    def __init__(self, schema, name, table, columns):
        super(IndexImage, self).__init__(schema, name)
        self.place(schema.indexes)
        schema.link(self)
        table.link(self)
        for column in columns:
            if column is not None:
                column.link(self)
        #: Indexed table.
        self.table = table
        #: Indexed columns.
        self.columns = columns
        #: Index comment.
        self.comment = None

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_name(self, name):
        """Changes the index name."""
        if self.name == name:
            return self
        sql = sql_rename_index(self.qname, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def drop(self):
        """Deletes the index."""
        sql = sql_drop_index(self.qname)
        self.cursor.execute(sql)
        self.remove()

    def reset(self):
        """Rebuilds the index."""
        column_names = [column.name for column in self.columns]
        sql = sql_create_index(self.name, self.table.qname, column_names)
        self.cursor.execute(sql)


class SequenceImage(NamespacedImage):
    """Sequence."""

    __slots__ = ('comment',)

    def __init__(self, schema, name):
        super(SequenceImage, self).__init__(schema, name)
        self.place(schema.sequences)
        schema.link(self)
        #: Sequence comment.
        self.comment = None

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_name(self, name):
        """Renames the sequence."""
        if self.name == name:
            return self
        sql = sql_rename_sequence(self.qname, name)
        self.cursor.execute(sql)
        return self.set_name(name)


class TypeImage(NamespacedImage):
    """Type."""

    __slots__ = ('comment',)
    is_domain = False
    is_enum = False

    def __init__(self, schema, name):
        super(TypeImage, self).__init__(schema, name)
        self.place(schema.types)
        schema.link(self)
        #: Type comment.
        self.comment = None

    @property
    def columns(self):
        """List of existing columns of this type."""
        return self.find(ColumnImage)

    @property
    def domains(self):
        """List of domains that wrap this type."""
        return self.find(DomainTypeImage)

    @property
    def procedures(self):
        """List of procedures that use this type."""
        return self.find(ProcedureImage)

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_name(self, name):
        """Changes the type name."""
        if self.name == name:
            return self
        sql = sql_rename_type(self.qname, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def drop(self):
        """Deletes the type."""
        sql = sql_drop_type(self.qname)
        self.cursor.execute(sql)
        self.remove()


class DomainTypeImage(TypeImage):
    """Domain type."""

    __slots__ = ('base_type',)
    is_domain = True

    def __init__(self, schema, name, base_type):
        super(DomainTypeImage, self).__init__(schema, name)
        base_type.link(self)
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
        return "%s(%s)" % (self.name, ", ".join(str(type) for type in self.types))


class ProcedureImage(IndexedImage):
    """Stored procedure."""

    __slots__ = ('name', 'types', 'return_type', 'source', 'comment')

    def __init__(self, schema, name, types, return_type, source):
        signature = ProcedureSignature(name, tuple(types))
        super(ProcedureImage, self).__init__(schema, signature)
        self.place(schema.procedures)
        schema.link(self)
        for type in types:
            type.link(self)
        return_type.link(self)
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

    @property
    def schema(self):
        """Procedure owner."""
        return self.owner()

    @property
    def qname(self):
        """
        The qualified name.
        """
        return (self.owner().name, self.name)

    @property
    def triggers(self):
        """List of triggers that call this procedure."""
        return self.find(TriggerImage)

    def set_name(self, name):
        """Renames the procedure."""
        self.name = name
        handle = ProcedureSignature(name, tuple(self.types))
        return self.set_handle(handle)

    def set_source(self, source):
        """Sets the procedure body."""
        self.source = source
        return self

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_name(self, name):
        """Changes the procedure name."""
        if self.name == name:
            return self
        type_qnames = [type.qname for type in self.types]
        sql = sql_rename_function(self.qname, type_qnames, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def alter_source(self, source):
        """Changes the procedure body."""
        if self.source == source:
            return self
        type_qnames = [type.qname for type in self.types]
        sql = sql_create_function(
                self.qname, type_qnames, self.return_type.qname,
                "plpgsql", source)
        self.cursor.execute(sql)
        return self.set_source(source)

    def drop(self):
        """Drops the procedure."""
        type_qnames = [type.qname for type in self.types]
        sql = sql_drop_function(self.qname, type_qnames)
        self.cursor.execute(sql)
        self.remove()


class TableImage(NamespacedImage):
    """Database table."""

    __slots__ = ('columns', 'constraints', 'primary_key', 'unique_keys',
                 'foreign_keys', 'referring_foreign_keys', 'triggers',
                 'data', 'comment', 'is_unlogged')

    def __init__(self, schema, name, is_unlogged=False):
        super(TableImage, self).__init__(schema, name)
        self.place(schema.tables)
        schema.link(self)
        #: Collection of table columns.
        self.columns = ImageMap()
        #: Collection of table constraints.
        self.constraints = ImageMap()
        #: Primary key constraint.
        self.primary_key = None
        #: List of unique constraints.
        self.unique_keys = ImageList()
        #: List of foreign keys owned by the table.
        self.foreign_keys = ImageList()
        #: List of foreign keys referring to the table.
        self.referring_foreign_keys = ImageList()
        #: Collection of triggers.
        self.triggers = ImageMap()
        #: Table rows.
        self.data = None
        #: Table comment.
        self.comment = None
        #: The table was created as `UNLOGGED`?
        self.is_unlogged = is_unlogged

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
        return self.find(IndexImage)

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

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def create_column(self, name, type, is_not_null, default=None):
        """Creates a column."""
        sql = sql_add_column(self.qname, name, type.qname, is_not_null, default)
        self.cursor.execute(sql)
        return self.add_column(name, type, is_not_null, default)

    def create_unique_key(self, name, columns, is_primary=False):
        """Creates a ``UNIQUE`` or ``PRIMARY KEY`` constraint."""
        column_names = [column.name for column in columns]
        sql = sql_add_unique_constraint(
                self.qname, name, column_names, is_primary)
        self.cursor.execute(sql)
        key = self.add_unique_key(name, columns, is_primary)
        # Each `UNIQUE` constraint maintains an index with the same name.
        index = self.schema.add_index(name, self, columns)
        key.link(index)
        return key

    def create_primary_key(self, name, columns):
        """Creates a ``PRIMARY KEY`` constraint."""
        return self.create_unique_key(name, columns, True)

    def create_foreign_key(self, name, columns, target, target_columns,
                           on_update=None, on_delete=None):
        """Creates a ``FOREIGN KEY`` constraint."""
        if on_update == NO_ACTION:
            on_update = None
        if on_delete == NO_ACTION:
            on_delete = None
        column_names = [column.name for column in columns]
        target_column_names = [column.name for column in target_columns]
        sql = sql_add_foreign_key_constraint(
                self.qname, name, column_names,
                target.qname, target_column_names,
                on_update=on_update, on_delete=on_delete)
        self.cursor.execute(sql)
        return self.add_foreign_key(
                name, columns, target, target_columns,
                on_update=on_update, on_delete=on_delete)

    def create_trigger(self, name, when, event, procedure, arguments):
        """Creates a trigger."""
        sql = sql_create_trigger(
                self.qname, name, when, event, procedure.qname, arguments)
        self.cursor.execute(sql)
        return self.add_trigger(name, procedure)

    def select(self):
        """Fetches table records."""
        sql = sql_select(self.qname, [column.name for column in self.columns])
        self.cursor.execute(sql)
        return self.add_data(self.cursor.fetchall())

    def alter_name(self, name):
        """Renames the table."""
        if self.name == name:
            return self
        sql = sql_rename_table(self.qname, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def alter_comment(self, comment):
        """Updates the table comment."""
        if self.comment == comment:
            return self
        sql = sql_comment_on_table(self.qname, comment)
        self.cursor.execute(sql)
        return self.set_comment(comment)

    def drop(self):
        """Drops the table."""
        sql = sql_drop_table(self.qname)
        self.cursor.execute(sql)
        self.remove()


class ViewImage(NamespacedImage):
    """Database view."""

    __slots__ = ('comment', 'definition')

    def __init__(self, schema, name, definition):
        super(NamespacedImage, self).__init__(schema, name)
        self.place(schema.tables)
        schema.link(self)
        #: View comment.
        self.comment = None
        #: View definition.
        self.definition = definition

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_name(self, name):
        """Renames the view."""
        if self.name == name:
            return self
        sql = sql_rename_view(self.qname, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def alter_comment(self, comment):
        """Updates the view comment."""
        if self.comment == comment:
            return self
        sql = sql_comment_on_view(self.qname, comment)
        self.cursor.execute(sql)
        return self.set_comment(comment)

    def drop(self):
        """Drops the view."""
        sql = sql_drop_view(self.qname)
        self.cursor.execute(sql)
        self.remove()


class ColumnImage(NamedImage):
    """Database column."""

    __slots__ = ('type', 'is_not_null', 'default', 'comment')

    def __init__(self, table, name, type, is_not_null, default=None):
        super(ColumnImage, self).__init__(table, name)
        self.place(table.columns)
        table.link(self)
        type.link(self)
        if table.data is not None:
            table.data.remove()
        #: Column type.
        self.type = type
        #: Has ``NOT NULL`` constraint?
        self.is_not_null = is_not_null
        #: Default column value.
        self.default = default
        #: Column comment.
        self.comment = None

    @property
    def table(self):
        """Column owner."""
        return self.owner()

    @property
    def position(self):
        """Column position."""
        return list(self.table.columns.values()).index(self)

    def __repr__(self):
        return "<%s %s.%s : %s%s>" % (self.__class__.__name__,
                                      self.table, self,
                                      self.type,
                                      "?" if not self.is_not_null else "")

    @property
    def unique_keys(self):
        """List of unique keys that include the column."""
        return [key
                for key in self.find(UniqueKeyImage)
                if not key.is_primary and key.origin_columns == [self]]

    @property
    def foreign_keys(self):
        """List of foreign keys that include the column."""
        return [foreign_key
                for foreign_key in self.find(ForeignKeyImage)
                if foreign_key.origin_columns == [self]]

    @property
    def referring_foreign_keys(self):
        """List of foreign keys that refer to the column."""
        return [foreign_key
                for foreign_key in self.find(ForeignKeyImage)
                if foreign_key.target_columns == [self]]

    @property
    def indexes(self):
        """List of all indexes that cover the column."""
        return self.find(IndexImage)

    @property
    def sequences(self):
        """List of all sequences owned by the column."""
        return self.find(SequenceImage)

    def set_position(self, position):
        "Sets the column position."""
        if position != len(self.table.columns)-1:
            raise NotImplementedError()
        if self.position == position:
            return self
        self.table.columns.remove(self)
        self.table.columns.add(self)
        if self.table.data is not None:
            self.table.data.remove()
        return self

    def set_type(self, type):
        """Changes the column type."""
        self.type.unlink(self)
        type.link(self)
        self.type = type
        if self.table.data is not None:
            self.table.data.remove()
        return self

    def set_is_not_null(self, is_not_null):
        """Sets or unsets ``NOT NULL`` constraint."""
        self.is_not_null = is_not_null
        return self

    def set_default(self, default):
        """Sets the default value expression."""
        self.default = default
        return self

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_position(self, position):
        if position == self.position:
            return self
        sql = sql_add_column(self.table.qname, "?", self.type.qname, False)
        self.cursor.execute(sql)
        sql = sql_copy_column(self.table.qname, "?", self.name)
        self.cursor.execute(sql)
        sql = sql_drop_column(self.table.qname, self.name)
        self.cursor.execute(sql)
        self.reset("?")
        return self.set_position(position)

    def alter_type(self, type, expression=None):
        """Updates the column type."""
        if self.type is type:
            return self
        sql = sql_set_column_type(
                self.table.qname, self.name, type.qname, expression)
        self.cursor.execute(sql)
        # PostgreSQL loses comments on constraints associated with
        # the column.  We need to reapply them again.
        for unique_key in self.table.unique_keys:
            if self in unique_key.origin_columns:
                unique_key.reset(only_comment=True)
        return self.set_type(type)

    def alter_is_not_null(self, is_not_null):
        """Updates the ``NOT NULL`` constraint."""
        if self.is_not_null == is_not_null:
            return self
        sql = sql_set_column_not_null(self.table.qname, self.name, is_not_null)
        self.cursor.execute(sql)
        return self.set_is_not_null(is_not_null)

    def alter_default(self, default):
        """Updates the default column value."""
        if self.default == default:
            return self
        sql = sql_set_column_default(self.table.qname, self.name, default)
        self.cursor.execute(sql)
        return self.set_default(default)

    def alter_comment(self, comment):
        """Updates the comment on the column."""
        if self.comment == comment:
            return self
        sql = sql_comment_on_column(self.table.qname, self.name, comment)
        self.cursor.execute(sql)
        return self.set_comment(comment)

    def alter_name(self, name):
        """Updates the column name."""
        if self.name == name:
            return self
        sql = sql_rename_column(self.table.qname, self.name, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def drop(self):
        """Deletes the column from the table."""
        sql = sql_drop_column(self.table.qname, self.name)
        self.cursor.execute(sql)
        self.remove()

    def reset(self, temp_name=None):
        """Rebuilds the column."""
        if temp_name is None:
            sql = sql_add_column(
                    self.table.qname, self.name, self.type.qname,
                    self.is_not_null, self.default)
            self.cursor.execute(sql)
        else:
            sql = sql_rename_column(
                    self.table.qname, temp_name, self.name)
            self.cursor.execute(sql)
            if self.is_not_null:
                sql = sql_set_column_not_null(
                        self.table.qname, self.name, True)
                self.cursor.execute(sql)
            if self.default is not None:
                sql = sql_set_column_default(
                        self.table.qname, self.name, self.default)
                self.cursor.execute(sql)
        if self.comment is not None:
            sql = sql_comment_on_column(
                    self.table.qname, self.name, self.comment)
            self.cursor.execute(sql)
        unique_key_indexes = []
        for unique_key in self.table.unique_keys:
            if self in unique_key.origin_columns:
                unique_key.reset()
                unique_key_indexes.extend(unique_key.indexes)
        for foreign_key in self.table.foreign_keys:
            if self in foreign_key.origin_columns:
                foreign_key.reset()
        for foreign_key in self.table.referring_foreign_keys:
            if self not in foreign_key.origin_columns and \
                    self in foreign_key.target_columns:
                foreign_key.reset()
        for index in self.indexes:
            if index not in unique_key_indexes:
                index.reset()


class ConstraintImage(NamedImage):
    """Table constraint."""

    __slots__ = ('comment',)

    def __init__(self, origin, name):
        super(ConstraintImage, self).__init__(origin, name)
        self.place(origin.constraints)
        origin.link(self)
        #: Constraint comment.
        self.comment = None

    @property
    def origin(self):
        """Constraint owner."""
        return self.owner()

    def __repr__(self):
        return "<%s %s.%s>" % (self.__class__.__name__, self.origin, self)

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_name(self, name):
        """Renames the constraint."""
        if self.name == name:
            return self
        sql = sql_rename_constraint(self.origin.qname, self.name, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def alter_comment(self, comment):
        """Updates the comment."""
        if self.comment == comment:
            return self
        sql = sql_comment_on_constraint(
                self.origin.qname, self.name, comment)
        self.cursor.execute(sql)
        return self.set_comment(comment)

    def drop(self):
        """Drops the constraint."""
        sql = sql_drop_constraint(self.origin.qname, self.name)
        self.cursor.execute(sql)
        self.remove()


class UniqueKeyImage(ConstraintImage):
    """``UNIQUE``/``PRIMARY KEY`` constraint."""

    __slots__ = ('origin_columns', 'is_primary')

    def __init__(self, origin, name, origin_columns, is_primary):
        super(UniqueKeyImage, self).__init__(origin, name)
        self.place(origin.unique_keys)
        for column in origin_columns:
            column.link(self)
        if origin.data is not None:
            origin.data.remove()
        #: Key columns.
        self.origin_columns = origin_columns
        #: ``UNIQUE`` or ``PRIMARY KEY``
        self.is_primary = is_primary
        if is_primary:
            assert origin.primary_key is None
            origin.primary_key = self

    @property
    def indexes(self):
        """Indexes maintained by the constraint."""
        return self.find(IndexImage)

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
        if self.is_primary:
            self.origin.primary_key = None
        super(UniqueKeyImage, self).remove()

    def alter_name(self, name):
        # The index name is automatically updated.
        index = self.origin.schema.indexes[self.name]
        if index is not None:
            index.set_name(name)
        return super(UniqueKeyImage, self).alter_name(name)

    def reset(self, only_comment=False):
        """Rebuilds the constraint."""
        if not only_comment:
            column_names = [column.name for column in self.origin_columns]
            sql = sql_add_unique_constraint(
                    self.origin.qname, self.name, column_names, self.is_primary)
            self.cursor.execute(sql)
        if self.comment is not None:
            sql = sql_comment_on_constraint(
                    self.origin.qname, self.name, self.comment)
            self.cursor.execute(sql)
        return self


NO_ACTION = 'NO ACTION'
RESTRICT = 'RESTRICT'
CASCADE = 'CASCADE'
SET_NULL = 'SET NULL'
SET_DEFAULT = 'SET DEFAULT'


class ForeignKeyImage(ConstraintImage):
    """Foreign key constraint."""

    __slots__ = ('origin_columns', 'coowner', 'target_columns',
                 'on_update', 'on_delete')

    def __init__(self, origin, name, origin_columns, target, target_columns,
                 on_update=None, on_delete=None):
        super(ForeignKeyImage, self).__init__(origin, name)
        self.place(origin.foreign_keys)
        for column in origin_columns:
            column.link(self)
        self.place(target.referring_foreign_keys)
        if target is not origin:
            target.link(self)
        for column in target_columns:
            column.link(self)
        if origin.data is not None:
            origin.data.remove()
        #: Key columns.
        self.origin_columns = origin_columns
        self.coowner = weakref.ref(target)
        #: Target key columns.
        self.target_columns = target_columns
        #: Action to perform when the referenced column is updated.
        self.on_update = on_update or NO_ACTION
        #: Action to perform when the referenced row is deleted.
        self.on_delete = on_delete or NO_ACTION

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
        return (column_pair in list(zip(self.origin_columns, self.target_columns)))

    def __getitem__(self, index):
        """Returns a column pair by index."""
        return (self.origin_columns[index], self.target_columns[index])

    def __iter__(self):
        """Iterates over column pairs."""
        return iter(zip(self.origin_columns, self.target_columns))

    def __len__(self):
        """Number of columns in the key."""
        return len(self.origin_columns)

    def set_on_update(self, on_update):
        """Sets ``ON DELETE`` action."""
        self.on_update = on_update or NO_ACTION
        return self

    def set_on_delete(self, on_delete):
        """Sets ``ON DELETE`` action."""
        self.on_delete = on_delete or NO_ACTION
        return self

    def alter_on_delete(self, on_delete):
        """Updates ``ON DELETE`` action."""
        if self.on_delete == (on_delete or NO_ACTION):
            return self
        self.set_on_delete(on_delete)
        sql = sql_drop_constraint(self.origin.qname, self.name)
        self.cursor.execute(sql)
        return self.reset()

    def reset(self):
        """Rebuilds the constraint."""
        column_names = [column.name for column in self.origin_columns]
        target_column_names = [column.name for column in self.target_columns]
        on_update = self.on_update
        if on_update == NO_ACTION:
            on_update = None
        on_delete = self.on_delete
        if on_delete == NO_ACTION:
            on_delete = None
        sql = sql_add_foreign_key_constraint(
                self.origin.qname, self.name, column_names,
                self.target.qname, target_column_names,
                on_update=on_update, on_delete=on_delete)
        self.cursor.execute(sql)
        if self.comment is not None:
            sql = sql_comment_on_constraint(
                    self.origin.qname, self.name, comment)
            self.cursor.execute(sql)
        return self


BEFORE = 'BEFORE'
AFTER = 'AFTER'
INSERT = 'INSERT'
UPDATE = 'UPDATE'
DELETE = 'DELETE'
INSERT_UPDATE = 'INSERT OR UPDATE'
INSERT_DELETE = 'INSERT OR DELETE'
UPDATE_DELETE = 'UPDATE OR DELETE'
INSERT_UPDATE_DELETE = 'INSERT OR UPDATE OR DELETE'


class TriggerImage(NamedImage):
    """Table trigger."""

    __slots__ = ('procedure', 'comment')

    def __init__(self, table, name, procedure):
        super(TriggerImage, self).__init__(table, name)
        self.place(table.triggers)
        table.link(self)
        procedure.link(self)
        #: Procedure to call.
        self.procedure = procedure
        #: Comment on the trigger.
        self.comment = None

    @property
    def table(self):
        """Trigger owner."""
        return self.owner()

    def __repr__(self):
        return "<%s %s.%s>" % (self.__class__.__name__, self.table, self)

    def set_comment(self, comment):
        """Sets the comment."""
        self.comment = comment
        return self

    def alter_comment(self, comment):
        """Updates the comment on the trigger."""
        if self.comment == comment:
            return self
        sql = sql_comment_on_trigger(self.table.qname, self.name, comment)
        self.cursor.execute(sql)
        return self.set_comment(comment)

    def alter_name(self, name):
        """Renames the trigger."""
        if self.name == name:
            return self
        sql = sql_rename_trigger(self.table.qname, self.name, name)
        self.cursor.execute(sql)
        return self.set_name(name)

    def drop(self):
        """Drops the trigger."""
        sql = sql_drop_trigger(self.table.qname, self.name)
        self.cursor.execute(sql)
        self.remove()


class DataImage(Image):
    """Table rows."""

    __slots__ = ('masks', 'indexes')

    def __init__(self, table, rows):
        super(DataImage, self).__init__(table)
        table.data = self
        table.link(self)
        for column in table.columns:
            column.link(self)
        for unique_key in table.unique_keys:
            unique_key.link(self)
        self.masks = {}
        self.indexes = {}
        for key in table.unique_keys:
            names = list(table.columns.keys())
            mask = tuple(names.index(column.name) for column in key)
            index = {}
            for row in rows:
                handle = tuple(row[idx] for idx in mask)
                if None not in handle:
                    index[handle] = row
            self.masks[key] = mask
            self.indexes[key] = index

    @property
    def table(self):
        """Table."""
        return self.owner()

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, self.table)

    def remove(self):
        self.table.data = None
        super(DataImage, self).remove()

    def append_row(self, new_row):
        """Adds a new row."""
        for key in self.table.unique_keys:
            mask = self.masks[key]
            index = self.indexes[key]
            handle = tuple(new_row[idx] for idx in mask)
            if None not in handle:
                index[handle] = new_row

    def replace_row(self, old_row, new_row):
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

    def remove_row(self, old_row):
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

    def insert(self, columns, values):
        """Inserts a record into the table."""
        names = [column.name for column in columns]
        returning_names = [column.name for column in self.table]
        sql = sql_insert(self.table.qname, names, values, returning_names)
        self.cursor.execute(sql)
        output = self.cursor.fetchall()
        assert len(output) == 1
        self.append_row(output[0])

    def update(self, old_row, columns, values):
        """Updates a table record."""
        key_column = self.table.columns.first()
        assert len(key_column.unique_keys) > 0
        key_value = old_row[0]
        assert key_value is not None
        names = [column.name for column in columns]
        returning_names = [column.name for column in self.table]
        sql = sql_update(
                self.table.qname, key_column.name, key_value,
                names, values, returning_names)
        self.cursor.execute(sql)
        output = self.cursor.fetchall()
        assert len(output) == 1
        self.replace_row(old_row, output[0])

    def delete(self, old_row):
        """Deletes a record from the table."""
        key_column = self.table.columns.first()
        assert len(key_column.unique_keys) > 0
        key_value = old_row[0]
        assert key_value is not None
        sql = sql_delete(self.table.qname, key_column.name, key_value)
        self.cursor.execute(sql)
        self.remove_row(old_row)


def make_catalog(cursor):
    """Creates an empty catalog image."""
    return CatalogImage(cursor)


