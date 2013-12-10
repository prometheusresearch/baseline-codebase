#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, locate
from .fact import Fact, FactVal, LabelVal
from .sql import (mangle, sql_create_table, sql_drop_table, sql_define_column,
        sql_add_unique_constraint, sql_drop_type)


class TableFact(Fact):
    """
    Describes a database table.

    `label`: ``unicode``
        The name of the table.
    `is_present`: ``bool``
        Indicates whether the table exists in the database.
    `related`: [:class:`Fact`] or ``None``
        Facts to be deployed when the table is deployed.  Could be specified
        only when ``is_present`` is ``True``.

    YAML record has the following fields:

    `table`: ``<label>``
        The table name.
    `present`: ``true`` (default) or ``false``
        Indicates whether the table exists in the database.
    `with`: [...]
        List of facts related to the table.  For related facts,
        the ``of`` field is automatically set to the name of the table.

    Deploying when ``is_present`` is on:

        Ensures that there exists a table ``<label>`` with a surrogate
        key column ``id``.  All facts in ``related`` list are deployed
        as well.

    Deploing when ``is_present`` is off:

        Ensures that there is no table called ``<label>`` in the database.
        If such a table exists, it is deleted.

        Links targeting the table will prevent the table from being deleted.
    """

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
        related = None
        if spec.with_:
            related = []
            for related_spec in spec.with_:
                if 'of' not in related_spec._fields:
                    raise Error("Got unrelated fact:",
                                locate(related_spec))
                if related_spec.of is None:
                    related_spec = related_spec.__clone__(of=label)
                if related_spec.of != label:
                    raise Error("Got unrelated fact:",
                                locate(related_spec))
                related_fact = driver.build(related_spec)
                related.append(related_fact)
        return cls(label, is_present=is_present, related=related)

    def __init__(self, label, is_present=True, related=None):
        # Validate input constraints.
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (related is None or
                    (isinstance(related, list) and
                     all(isinstance(fact, Fact) for fact in related)))
        else:
            assert related is None
        self.label = label
        self.is_present = is_present
        self.related = related
        self.name = mangle(label)

    def __repr__(self):
        args = []
        args.append(repr(self.label))
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        if self.related is not None:
            args.append("related=%r" % self.related)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            return self.create(driver)
        else:
            return self.drop(driver)

    def create(self, driver):
        # Ensures that the table exists.
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
        if self.related:
            driver(self.related)

    def drop(self, driver):
        # Ensures that the table does not exist.
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
            raise Error("Cannot delete a table with links into it:", self.name)
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


