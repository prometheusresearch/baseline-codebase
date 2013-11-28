#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, OneOfVal, ChoiceVal, SeqVal
from .fact import Fact, UnicodeVal, LabelVal, DottedLabelVal
from .sql import (mangle, sql_add_column, sql_drop_column,
        sql_create_enum_type, sql_drop_type)


class ColumnFact(Fact):

    # HTSQL name -> SQL name.
    TYPE_MAP = {
            "boolean": "bool",
            "integer": "int4",
            "decimal": "numeric",
            "float": "float8",
            "text": "text",
            "date": "date",
            "time": "time",
            "datetime": "timestamp",
    }

    fields = [
            ('column', DottedLabelVal()),
            ('of', LabelVal(), None),
            ('type', OneOfVal(ChoiceVal(*sorted(TYPE_MAP)),
                              SeqVal(UnicodeVal(r'[0-9A-Za-z_-]+'))), None),
            ('required', BoolVal(), None),
            ('present', BoolVal(), True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if u'.' in spec.column:
            table_label, label = spec.column.split(u'.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.column
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        is_present = spec.present
        type = spec.type
        if is_present:
            if type is None:
                raise Error("Got missing clause:", "type")
            if isinstance(type, list):
                if len(type) == 0:
                    raise Error("Got missing enum labels")
                if len(set(type)) < len(type):
                    raise Error("Got duplicate enum labels:",
                                ", ".join(type))
        else:
            if type is not None:
                raise Error("Got unexpected clause:", "type")
        is_required = spec.required
        if is_present:
            if is_required is None:
                is_required = True
        else:
            if is_required is not None:
                raise Error("Got unexpected clause:", "required")
        return cls(table_label, label, type=type, is_required=is_required,
                   is_present=is_present)

    def __init__(self, table_label, label, type=None, is_required=None,
                 is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(type, str) and type in self.TYPE_MAP or
                    isinstance(type, list) and len(type) > 0 and
                    all(isinstance(label, unicode) and len(label) > 0
                        for label in type) and
                    len(set(type)) == len(type))
            assert isinstance(is_required, bool)
        else:
            assert type is None
            assert is_required is None
        self.table_label = table_label
        self.label = label
        self.type = type
        self.is_required = is_required
        self.is_present = is_present
        #: Table SQL name.
        self.table_name = mangle(table_label)
        #: Column SQL name.
        self.name = mangle(label)
        if isinstance(type, list):
            #: Type SQL name.
            self.type_name = mangle([table_label, label], u'enum')
            #: Labels for ``ENUM`` type.
            self.enum_labels = type
        else:
            self.type_name = self.TYPE_MAP[self.type]
            self.enum_labels = None

    def __yaml__(self):
        yield ('column', self.label)
        yield ('of', self.table_label)
        if self.type is not None:
            yield ('type', self.type)
        if self.is_required is not None:
            yield ('required', self.is_required)
        if not self.is_present:
            yield ('present', self.is_present)

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.type is not None:
            args.append(repr(self.type))
        if self.is_required is not None:
            args.append("is_required=%r" % self.is_required)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the column is present.
        schema = driver.get_schema()
        # Find the table.
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        # Determine the column type.
        if self.enum_labels:
            # Make sure the ENUM type exists.
            # Create the type if it does not exist and update the catalog.
            if self.type_name not in schema.types:
                if driver.is_locked:
                    raise Error("Detected missing ENUM type:", self.type_name)
                driver.submit(sql_create_enum_type(
                        self.type_name, self.enum_labels))
                schema.add_enum_type(self.type_name, self.enum_labels)
            # Check that the type is the one we expect.
            type = schema.types[self.type_name]
            if not (type.is_enum and type.labels == self.enum_labels):
                raise Error("Detected mismatched ENUM type:", self.type_name)
        else:
            # A regular system type.
            system_schema = driver.get_catalog()['pg_catalog']
            type = system_schema.types[self.type_name]
        table = schema[self.table_name]
        # Create the column if it does not exist.
        if self.name not in table:
            if driver.is_locked:
                raise Error("Detected missing column:",
                            "%s.%s" % (table, self.name))
            driver.submit(sql_add_column(
                    self.table_name, self.name, self.type_name,
                    self.is_required))
            table.add_column(self.name, type, self.is_required)
        # Check that the column has the right type and constraints.
        column = table[self.name]
        if column.type != type:
            raise Error("Detected column with mismatched type:", column)
        if column.is_not_null != self.is_required:
            raise Error("Detected column with mismatched"
                        " NOT NULL constraint:", column)

    def drop(self, driver):
        # Ensures that the column is absent.
        schema = driver.get_schema()
        if self.table_name not in schema:
            return
        table = schema[self.table_name]
        if self.name not in table:
            return
        column = table[self.name]
        if driver.is_locked:
            raise Error("Detected unexpected column:", column)
        # Drop the column.
        type = column.type
        driver.submit(sql_drop_column(self.table_name, self.name))
        column.remove()
        # Drop the dependent ENUM type.
        if type.is_enum:
            driver.submit(sql_drop_type(type.name))
            type.remove()


