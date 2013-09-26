#
# Copyright (c) 2013, Prometheus Research, LLC
#


import htsql.core.util
import weakref


class Record(object):
    # Represents a database entity.

    __slots__ = ('owner',)

    def __init__(self, owner):
        self.owner = owner

    def remove(self):
        for cls in self.__class__.__mro__:
            if hasattr(cls, '__slots__'):
                for slot in cls.__slots__:
                    if not (slot.startswith('__') and slot.endswith('__')):
                        delattr(self, slot)


class NamedRecord(Record):
    # Represents a database entity with a name.

    __slots__ = ('name',)

    max_name_length = 63

    def __init__(self, owner, name):
        assert len(name) <= self.max_name_length
        super(NamedRecord, self).__init__(owner)
        self.name = name


class RecordCollection(htsql.core.util.omap):
    # A collection of named database entities.

    def add(self, record):
        if record.name in self:
            raise KeyError(record.name)
        self[record.name] = record

    def remove(self, record):
        if self.get(record.name) is not record:
            raise KeyError(record.name)
        del self[record.name]


class CatalogRecord(Record):
    # Database catalog.

    __slots__ = ('schemas', '__weakref__')

    def __init__(self):
        super(CatalogRecord, self).__init__(weakref.ref(self))
        self.schemas = RecordCollection()

    def __contains__(self, name):
        return (name in self.schemas)

    def __getitem__(self, name):
        return self.schemas[name]

    def __iter__(self):
        return iter(self.schemas)

    def __len__(self):
        return len(self.schemas)

    def get(self, name, default=None):
        return self.schemas.get(name, default)

    def remove(self):
        for schema in reversed(self.schemas):
            schema.remove()
        super(CatalogRecord, self).remove()

    def add_schema(self, name):
        return SchemaRecord(self, name)


class SchemaRecord(NamedRecord):
    # Database schema.

    __slots__ = ('tables', '__weakref__')

    def __init__(self, catalog, name):
        super(SchemaRecord, self).__init__(weakref.ref(catalog), name)
        self.tables = RecordCollection()
        catalog.schemas.add(self)

    @property
    def catalog(self):
        return self.owner()

    def __contains__(self, name):
        return (name in self.tables)

    def __getitem__(self, name):
        return self.tables[name]

    def __iter__(self):
        return iter(self.tables)

    def __len__(self):
        return len(self.tables)

    def get(self, name, default=None):
        return self.tables.get(name, default)

    def remove(self):
        for table in reversed(self.tables):
            table.remove()
        super(SchemaRecord, self).remove()

    def add_table(self, name):
        return TableRecord(self, name)


class TableRecord(NamedRecord):
    # Database table.

    __slots__ = ('columns', 'primary_key', 'unique_keys',
                 'foreign_keys', 'referring_foreign_keys', '__weakref__')

    def __init__(self, schema, name):
        super(TableRecord, self).__init__(weakref.ref(schema), name)
        self.columns = RecordCollection()
        self.primary_key = None
        self.unique_keys = []
        self.foreign_keys = []
        self.referring_foreign_keys = []
        schema.tables.add(self)

    @property
    def schema(self):
        return self.owner()

    def __contains__(self, name):
        return (name in self.columns)

    def __getitem__(self, name):
        return self.columns[name]

    def __iter__(self):
        return iter(self.columns)

    def __len__(self):
        return len(self.columns)

    def get(self, name, default=None):
        return self.columns.get(name, default)

    def remove(self):
        for column in reversed(self.columns):
            column.remove()
        super(TableRecord, self).remove()

    def add_column(self, name):
        return ColumnRecord(self, name)

    def add_unique_key(self, columns, is_primary=False):
        return UniqueKeyRecord(self, columns, is_primary)

    def add_primary_key(self, columns):
        return UniqueKeyRecord(self, columns, True)

    def add_foreign_key(self, columns, target, target_columns):
        return ForeignKeyRecord(self, columns, target, target_columns)


class ColumnRecord(NamedRecord):
    # Database column.

    __slots__ = ('__weakref__',)

    def __init__(self, table, name):
        super(ColumnRecord, self).__init__(weakref.ref(table), name)
        table.columns.add(self)

    @property
    def table(self):
        return self.owner()

    @property
    def unique_keys(self):
        return [unique_key
                for unique_key in self.table.unique_keys
                if self in unique_key.origin_columns]

    @property
    def foreign_keys(self):
        return [foreign_key
                for foreign_key in self.table.foreign_keys
                if self in foreign_key.origin_columns]

    @property
    def referring_foreign_keys(self):
        return [foreign_key
                for foreign_key in self.table.referring_foreign_keys
                if self in foreign_key.target_columns]

    def remove(self):
        for unique_key in self.unique_keys:
            unique_key.remove()
        for foreign_key in self.foreign_keys:
            foreign_key.remove()
        for foreign_key in self.referring_foreign_keys:
            foreign_key.remove()
        self.table.columns.remove(self)
        super(ColumnEntity, self).remove()


class UniqueKeyRecord(Record):

    __slots__ = ('origin_columns', 'is_primary')

    def __init__(self, origin, origin_columns, is_primary):
        super(UniqueKeyRecord, self).__init__(weakref.ref(origin))
        self.origin_columns = origin_columns
        self.is_primary = is_primary
        if is_primary:
            assert origin.primary_key is None
            origin.primary_key = self
        origin.unique_keys.append(self)

    def set_is_primary(self, is_primary):
        if is_primary == self.is_primary:
            return self
        if is_primary:
            assert self.origin.primary_key is None
            self.origin_primary_key = self
        else:
            assert self.origin.primary_key is self
            self.origin.primary_key = None
        return self

    @property
    def origin(self):
        return self.owner()

    def __contains__(self, column):
        return (column in self.origin_columns)

    def __getitem__(self, index):
        return self.origin_columns[index]

    def __iter__(self):
        return iter(self.origin_columns)

    def __len__(self):
        return len(self.origin_columns)

    def remove(self):
        self.origin.unique_keys.remove(self)
        if self.is_primary:
            self.origin.primary_key = None
        super(UniqueKeyRecord, self).remove()


class ForeignKeyRecord(Record):

    __slots__ = ('origin_columns', 'coowner', 'target_columns')

    def __init__(self, origin, origin_columns, target, target_columns):
        super(ForeignKeyRecord, self).__init__(weakref.ref(origin))
        self.origin_columns = origin_columns
        self.coowner = weakref.ref(target)
        self.target_columns = target_columns
        origin.foreign_keys.append(self)
        target.referring_foreign_keys.append(self)

    @property
    def origin(self):
        return self.owner()

    @property
    def target(self):
        return self.coowner()

    def __contains__(self, column_pair):
        return (column_pair in zip(self.origin_columns, self.target_columns))

    def __getitem__(self, index):
        return (self.origin_columns[index], self.target_columns[index])

    def __iter__(self):
        return iter(zip(self.origin_columns, self.target_columns))

    def __len__(self):
        return len(self.origin_columns)

    def remove(self):
        self.origin.foreign_keys.remove(self)
        self.target.referring_foreign_keys.remove(self)
        super(ForeignKeyRecord, self).remove()


