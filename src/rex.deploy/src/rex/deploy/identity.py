#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, SeqVal
from .fact import Fact, LabelVal, QLabelVal
from .sql import mangle, sql_add_unique_constraint, sql_drop_constraint


class IdentityFact(Fact):

    fields = [
            ('identity', SeqVal(QLabelVal)),
            ('of', LabelVal, None),
    ]

    @classmethod
    def build(cls, driver, spec):
        table_label = spec.of
        labels = []
        if not spec.identity:
            raise Error("Got missing identity fields")
        for label in spec.identity:
            if u'.' in label:
                current_table_label = table_label
                table_label, label = label.split(u'.')
                if (current_table_label is not None and
                        table_label != current_table_label):
                    raise Error("Got mismatched table names:",
                                ", ".join((table_label, current_table_label)))
            labels.append(label)
        if table_label is None:
            raise Error("Got missing table name")
        return cls(table_label, labels)

    def __init__(self, table_label, labels):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert (isinstance(labels, list) and len(labels) > 0 and
                all(isinstance(label, unicode) for label in labels) and
                len(set(labels)) == len(labels))
        self.table_label = table_label
        self.labels = labels
        #: Table SQL name.
        self.table_name = mangle(table_label)
        #: Column/Link SQL names.
        self.names = [(mangle(label), mangle(label, u'id'))
                      for label in labels]
        #: Constraint SQL name.
        self.constraint_name = mangle(table_label, u'pk')

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.labels))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        # Ensures the `PRIMARY KEY` constraint exists.
        schema = driver.get_schema()
        if self.table_name not in schema:
            raise Error("Detected missing table:", self.table_name)
        table = schema[self.table_name]
        columns = []
        for column_name, link_name in self.names:
            if column_name in table:
                column = table[column_name]
            elif link_name in table:
                column = table[link_name]
            else:
                raise Error("Detected missing column:", column_name)
            columns.append(column)
        # Drop the `PRIMARY KEY` constraint if it does not match the identity.
        if (table.primary_key is not None and
                list(table.primary_key) != columns):
            if driver.is_locked:
                raise Error("Detected table with mismatched"
                            " PRIMARY KEY constraint:", table)
            driver.submit(sql_drop_constraint(
                    self.table_name, table.primary_key.name))
            table.primary_key.remove()
        # Create the `PRIMARY KEY` constraint if necessary.
        if table.primary_key is None:
            if driver.is_locked:
                raise Error("Detected table with missing"
                            " PRIMARY KEY constraint:", table)
            driver.submit(sql_add_unique_constraint(
                    self.table_name, self.constraint_name,
                    [column.name for column in columns], True))
            table.add_primary_key(self.constraint_name, columns)


