#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, locate
from .fact import Fact, FactVal, LabelVal
from .sql import (mangle, sql_create_table, sql_drop_table, sql_define_column,
        sql_add_unique_constraint, sql_drop_type)


class TableFact(Fact):

    fields = [
            ('table', LabelVal),
            ('present', BoolVal, True),
            ('with', SeqVal(FactVal), None),
    ]

    @classmethod
    def build(cls, driver, spec):
        label = spec.table
        is_present = spec.present
        if not is_present and spec.with_:
            raise Error("Got unexpected clause:", "with")
        nested_facts = None
        if spec.with_:
            nested_facts = []
            for nested_spec in spec.with_:
                if 'of' not in nested_spec._fields:
                    raise Error("Got unrelated nested fact:",
                                locate(nested_spec))
                if nested_spec.of is None:
                    nested_spec = nested_spec.__clone__(of=label)
                if nested_spec.of != label:
                    raise Error("Got unrelated nested fact:",
                                locate(nested_spec))
                nested_fact = driver.build(nested_spec)
                nested_facts.append(nested_fact)
        return cls(label, is_present=is_present, nested_facts=nested_facts)

    def __init__(self, label, is_present=True, nested_facts=None):
        # Validate input constraints.
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (nested_facts is None or
                    (isinstance(nested_facts, list) and
                     all(isinstance(fact, Fact) for fact in nested_facts)))
        else:
            assert nested_facts is None
        self.label = label
        self.is_present = is_present
        self.nested_facts = nested_facts
        #: Table SQL name.
        self.name = mangle(label)

    def __repr__(self):
        args = []
        args.append(repr(self.label))
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        if self.nested_facts is not None:
            args.append("nested_facts=%r" % self.nested_facts)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the table is present.
        schema = driver.get_schema()
        # Create the table if it does not exist.
        if self.name not in schema:
            if driver.is_locked:
                raise Error("Detected missing table:", self.name)
            # Submit `CREATE TABLE {name} (id serial4 NOT NULL)` and
            # `ADD CONSTRAINT UNIQUE (id)`.
            body = [sql_define_column(u'id', u'serial4', True)]
            key_name = mangle([self.label, u'id'], u'uk')
            driver.submit(sql_create_table(self.name, body))
            driver.submit(sql_add_unique_constraint(
                    self.name, key_name, [u'id'], False))
            # Update the catalog image.
            system_schema = driver.get_catalog()[u'pg_catalog']
            table = schema.add_table(self.name)
            int4_type = system_schema.types[u'int4']
            id_column = table.add_column(u'id', int4_type, True)
            table.add_unique_key(key_name, [id_column])
        # Verify that the table has `id` column with a UNIQUE contraint.
        table = schema[self.name]
        if u'id' not in table:
            raise Error("Detected missing column:", "id")
        id_column = table['id']
        if not any(unique_key.origin_columns == [id_column]
                   for unique_key in table.unique_keys):
            raise Error("Detected missing column UNIQUE constraint:", "id")
        # Apply nested facts.
        if self.nested_facts:
            driver(self.nested_facts)

    def drop(self, driver):
        # Ensures that the table is absent.
        schema = driver.get_schema()
        if self.name not in schema:
            return
        if driver.is_locked:
            raise Error("Detected unexpected table:", self.name)
        # Bail if there are links to the table.
        table = schema[self.name]
        if any(foreign_key
               for foreign_key in table.referring_foreign_keys
               if foreign_key.origin != table):
            raise Error("Cannot delete a table with links onto it:",
                        self.name)
        # Find `ENUM` types to be deleted with the table.
        enum_types = []
        for column in table:
            if column.type.is_enum:
                enum_types.append(column.type)
        # Submit `DROP TABLE {name}`.
        driver.submit(sql_drop_table(self.name))
        # Submit `DROP TYPE` statements.
        for enum_type in enum_types:
            driver.submit(sql_drop_type(enum_type.name))
        # Update the catalog image.
        table.remove()
        for enum_type in enum_types:
            enum_type.remove()


