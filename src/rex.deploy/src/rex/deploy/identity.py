#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, MaybeVal, UChoiceVal, SeqVal
from .fact import Fact, LabelVal, QLabelVal, PairVal
from .image import SET_DEFAULT, CASCADE
from .meta import PrimaryKeyMeta
from .sql import (mangle, sql_add_unique_constraint,
        sql_add_foreign_key_constraint, sql_drop_constraint,
        sql_comment_on_constraint, sql_create_function, sql_drop_function,
        sql_create_trigger, sql_drop_trigger, sql_primary_key_procedure,
        sql_integer_random_key, sql_text_random_key, sql_integer_offset_key,
        sql_text_offset_key)


class IdentityFact(Fact):
    """
    Describes identity of a table.

    `table_label`: ``unicode``
        The name of the table.
    `labels`: [``unicode``]
        Names of columns and links that constitute the table identity.
    """

    fields = [
            ('identity',
             SeqVal(PairVal(QLabelVal,
                            MaybeVal(UChoiceVal('offset', 'random'))))),
            ('of', LabelVal, None),
    ]

    @classmethod
    def build(cls, driver, spec):
        table_label = spec.of
        labels = []
        generators = []
        if not spec.identity:
            raise Error("Got missing identity fields")
        for label, generator in spec.identity:
            if u'.' in label:
                current_table_label = table_label
                table_label, label = label.split(u'.')
                if (current_table_label is not None and
                        table_label != current_table_label):
                    raise Error("Got mismatched table names:",
                                ", ".join((table_label, current_table_label)))
            labels.append(label)
            generators.append(generator)
        if table_label is None:
            raise Error("Got missing table name")
        return cls(table_label, labels, generators)

    def __init__(self, table_label, labels, generators=None):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert (isinstance(labels, list) and len(labels) > 0 and
                all(isinstance(label, unicode) for label in labels) and
                len(set(labels)) == len(labels))
        if generators is None:
            generators = [None]*len(labels)
        assert (isinstance(generators, list) and
                len(generators) == len(labels) and
                all(generator in (None, 'offset', 'random')
                    for generator in generators))
        self.table_label = table_label
        self.labels = labels
        self.generators = generators
        self.table_name = mangle(table_label)
        self.names = [(mangle(label), mangle(label, u'id'))
                      for label in labels]
        self.constraint_name = mangle(table_label, u'pk')
        self.procedure_name = mangle(table_label, u'pk')

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.labels))
        if any(generator is not None for generator in self.generators):
            args.append(repr(self.generators))
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
            schema.indexes[self.constraint_name].remove()
        # Create the `PRIMARY KEY` constraint if necessary.
        if table.primary_key is None:
            if driver.is_locked:
                raise Error("Detected table with missing"
                            " PRIMARY KEY constraint:", table)
            driver.submit(sql_add_unique_constraint(
                    self.table_name, self.constraint_name,
                    [column.name for column in columns], True))
            table.add_primary_key(self.constraint_name, columns)
            schema.add_index(self.constraint_name, table, columns)
        # Make sure that foreign keys contained in `PRIMARY KEY` columns
        # are set with `ON DELETE CASCADE` rule.
        for foreign_key in table.foreign_keys:
            if set(foreign_key.origin_columns).issubset(columns):
                on_delete = CASCADE
            else:
                on_delete = SET_DEFAULT
            if foreign_key.on_delete != on_delete:
                if driver.is_locked:
                    raise Error("Detected FOREIGN KEY with wrong"
                                " ON DELETE rule:", foreign_key)
                driver.submit(sql_drop_constraint(
                        self.table_name, foreign_key.name))
                driver.submit(sql_add_foreign_key_constraint(
                        self.table_name, foreign_key.name,
                        [column.name for column in foreign_key.origin_columns],
                        foreign_key.target.name,
                        [column.name for column in foreign_key.target_columns],
                        on_update=foreign_key.on_update, on_delete=on_delete))
                foreign_key.set_on_delete(on_delete)
        # Build a trigger for autogenerated identity columns.
        source = []
        for column, generator in zip(table.primary_key, self.generators):
            if generator == u'offset':
                source.append(self._make_offset_key(table, column))
            elif generator == u'random':
                source.append(self._make_random_key(table, column))
        signature = (self.procedure_name, ())
        procedure = schema.procedures.get(signature)
        trigger = table.triggers.get(self.procedure_name)
        if source:
            source = sql_primary_key_procedure(*source)
            # Check if we need to create or update the trigger.
            if (procedure is None or trigger is None or
                    procedure.source != source):
                if driver.is_locked:
                    raise Error("Detected missing identity trigger:",
                                self.procedure_name)
                # Clear the old trigger.
                if trigger is not None:
                    driver.submit(sql_drop_trigger(
                        self.table_name, self.procedure_name))
                    trigger.remove()
                if procedure is not None:
                    driver.submit(sql_drop_function(
                        self.procedure_name, ()))
                    procedure.remove()
                # Install a new trigger.
                driver.submit(sql_create_function(
                        self.procedure_name, (), u"trigger", u"plpgsql",
                        source))
                system_schema = driver.get_catalog()['pg_catalog']
                procedure = schema.add_procedure(
                        self.procedure_name, (),
                        system_schema.types[u'trigger'], source)
                driver.submit(sql_create_trigger(
                        self.table_name, self.procedure_name,
                        u"BEFORE", u"INSERT",
                        self.procedure_name, ()))
                table.add_trigger(self.procedure_name, procedure)
        else:
            # Remove the current trigger, if any.
            if driver.is_locked:
                if procedure is not None or trigger is not None:
                    raise Error("Detected an unexpected identity trigger:",
                                self.procedure_name)
            if trigger is not None:
                driver.submit(sql_drop_trigger(
                        self.table_name, self.procedure_name))
                trigger.remove()
            if procedure is not None:
                driver.submit(sql_drop_function(
                        self.procedure_name, ()))
                procedure.remove()
        # Save the generators on the `PRIMARY KEY` metadata.
        meta = PrimaryKeyMeta.parse(table.primary_key)
        if any(generator is not None for generator in self.generators):
            generators = self.generators
        else:
            generators = None
        if meta.update(generators=generators):
            comment = meta.dump()
            if driver.is_locked:
                raise Error("Detected PRIMARY KEY with wrong metadata:",
                            self.constraint_name)
            driver.submit(sql_comment_on_constraint(
                    self.table_name, self.constraint_name, comment))
            table.primary_key.set_comment(comment)

    def _make_offset_key(self, table, column):
        # Builds code for autogenerated offset primary key.
        basis_columns = table.primary_key.origin_columns
        index = basis_columns.index(column)
        basis_columns = basis_columns[:index]
        basis_names = [basis_column.name for basis_column in basis_columns]
        is_link = len(column.foreign_keys) > 0
        type_qname = (column.type.schema.name, column.type.name)
        if type_qname == (u'pg_catalog', u'int4') and not is_link:
            return sql_integer_offset_key(table.name, column.name, basis_names)
        elif type_qname == (u'pg_catalog', u'text') and not is_link:
            return sql_text_offset_key(table.name, column.name, basis_names)
        else:
            raise Error("Expected an integer or text column:", column)

    def _make_random_key(self, table, column):
        # Builds code for autogenerated random primary key.
        is_link = len(column.foreign_keys) > 0
        type_qname = (column.type.schema.name, column.type.name)
        if type_qname == (u'pg_catalog', u'int4') and not is_link:
            return sql_integer_random_key(table.name, column.name)
        elif type_qname == (u'pg_catalog', u'text') and not is_link:
            return sql_text_random_key(table.name, column.name)
        else:
            raise Error("Expected an integer or text column:", column)


