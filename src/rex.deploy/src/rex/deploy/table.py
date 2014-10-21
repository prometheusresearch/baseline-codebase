#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, OneOrSeqVal, locate
from .identity import _generate
from .fact import Fact, FactVal, LabelVal, TitleVal, label_to_title
from .meta import uncomment
from .recover import recover
from .sql import mangle


class TableFact(Fact):
    """
    Describes a database table.

    `label`: ``unicode``
        The name of the table.
    `former_labels`: [``unicode``]
        Names that the table may have had in the past.
    `is_reliable`: ``bool``
        Indicates whether the table is crush-safe.
    `title`: ``unicode`` or ``None``
        The title of the table.  If not set, generated from the label.
    `is_present`: ``bool``
        Indicates whether the table exists in the database.
    `related`: [:class:`Fact`] or ``None``
        Facts to be deployed when the table is deployed.  Could be specified
        only when ``is_present`` is ``True``.
    """

    fields = [
            ('table', LabelVal),
            ('was', OneOrSeqVal(LabelVal), None),
            ('reliable', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
            ('with', SeqVal(FactVal), None),
    ]

    @classmethod
    def build(cls, driver, spec):
        if not spec.present:
            for field in ['was', 'reliable', 'title']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
            if spec.with_ is not None:
                raise Error("Got unexpected clause:", "with")
        label = spec.table
        is_present = spec.present
        is_reliable = spec.reliable
        if is_present:
            if is_reliable is None:
                is_reliable = True
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        title = spec.title
        related = None
        after = None
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
                if 'after' in related_spec._fields:
                    if after is not None and related_spec.after is None:
                        related_spec = related_spec.__clone__(after=after)
                related_fact = driver.build(related_spec)
                related.append(related_fact)
                if hasattr(related_fact, 'label'):
                    after = related_fact.label
        return cls(label, former_labels=former_labels,
                   is_reliable=is_reliable, title=title,
                   is_present=is_present, related=related)

    @classmethod
    def recover(cls, driver, table):
        # Recovers the fact from an existing database table.
        schema = driver.get_schema()
        if table.schema is not schema:
            return None
        meta = uncomment(table)
        label = meta.label or table.name
        name = mangle(label)
        if name != table.name:
            return None
        if u'id' not in table:
            return None
        id_column = table['id']
        if not any(unique_key.origin_columns == [id_column]
                   for unique_key in table.unique_keys):
            return None
        is_reliable = (not table.is_unlogged)
        return cls(label, is_reliable=is_reliable, title=meta.title)

    def __init__(self, label, former_labels=[], is_reliable=None,
                 title=None, is_present=True, related=None):
        # Validate input constraints.
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, unicode)
                        for former_label in former_labels))
            if is_reliable is None:
                is_reliable = True
            assert isinstance(is_reliable, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
            assert (related is None or
                    (isinstance(related, list) and
                     all(isinstance(fact, Fact) for fact in related)))
        else:
            assert former_labels == []
            assert is_reliable is None
            assert title is None
            assert related is None
        self.label = label
        self.former_labels = former_labels
        self.is_reliable = is_reliable
        self.title = title
        self.is_present = is_present
        self.related = related
        self.name = mangle(label)
        self.uk_name = mangle(label, u'uk')
        self.seq_name = mangle(label, u'seq')

    def __repr__(self):
        args = []
        args.append(repr(self.label))
        if self.former_labels:
            args.append("former_labels=%r" % self.former_labels)
        if self.is_reliable is False:
            args.append("is_reliable=%r" % self.is_reliable)
        if self.title is not None:
            args.append("title=%r" % self.title)
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
        system_schema = driver.get_system_schema()
        # Check if we need to rename the table.
        if self.name not in schema:
            for former_label in self.former_labels:
                former = self.clone(label=former_label)
                if former.name not in schema:
                    continue
                table = schema[former.name]
                # Rename the table itself.
                table.alter_name(driver, self.name)
                # Rename auxiliary objects.
                self.rebase(driver, former)
                for column in table.columns:
                    field_fact = recover(driver, column)
                    if field_fact is not None:
                        field_fact.rebase(driver, table_label=former_label)
                identity_fact = recover(driver, table.primary_key)
                if identity_fact is not None:
                    identity_fact.rebase(driver, table_label=former_label)
                # Rename links into the table.
                for foreign_key in table.referring_foreign_keys:
                    if foreign_key.origin is table:
                        continue
                    for column in foreign_key.origin_columns:
                        field_fact = recover(driver, column)
                        if field_fact is None or \
                                field_fact.label != former_label:
                            continue
                        field_fact = field_fact.clone(
                                label=self.label, former_labels=[former_label])
                        field_fact(driver)
                break

        # Create the table if it does not exist.
        if self.name not in schema:
            # Create a table with an ``id`` column, a `UNIQUE` constraint and
            # a sequence on the column.
            int4_type = system_schema.types[u'int4']
            definitions = [(u'id', int4_type, True, None)]
            is_unlogged = (not self.is_reliable)
            table = schema.create_table(
                    driver, self.name, definitions, is_unlogged=is_unlogged)
            id_column = table[u'id']
            table.create_unique_key(driver, self.uk_name, [id_column])
            schema.create_sequence(driver, self.seq_name, id_column)
        # Verify that the table has a surrogate key.
        table = schema[self.name]
        if u'id' not in table or not table[u'id'].unique_keys:
            raise Error("Discovered table without surrogate key:", self.label)
        if table.is_unlogged != (not self.is_reliable):
            raise Error("Discovered table with mismatched"
                        " reliability mode:", self.label)
        # Store the original table label and the table title.
        meta = uncomment(table)
        saved_label = self.label if self.label != self.name else None
        saved_title = self.title if self.title != label_to_title(self.label) \
                      else None
        if meta.update(label=saved_label, title=saved_title):
            comment = meta.dump()
            table.alter_comment(driver, comment)
        # Apply nested facts.
        if self.related:
            driver(self.related)

    def drop(self, driver):
        # Ensures that the table does not exist.
        schema = driver.get_schema()
        if self.name not in schema:
            return
        table = schema[self.name]
        # Remove links to the table.
        for foreign_key in table.referring_foreign_keys:
            if foreign_key.origin is table:
                continue
            for column in foreign_key.origin_columns:
                link_fact = recover(driver, column)
                if link_fact is not None:
                    link_fact.drop(driver)
        # Gather facts to be purged.
        field_facts = [recover(driver, column) for column in table]
        identity_fact = recover(driver, table.primary_key)
        # Execute `DROP TABLE`.
        table.drop(driver)
        # Purge the remains.
        for field_fact in field_facts:
            if field_fact is not None:
                field_fact.purge(driver)
        if identity_fact is not None:
            identity_fact.purge(driver)

    def rebase(self, driver, former=None, **kwds):
        # Renames auxiliary objects after the table is renamed.
        if former is None:
            former = self.clone(**kwds)
        schema = driver.get_schema()
        assert self.name in schema
        table = schema[self.name]
        # Rename the sequence.
        sequence = schema.sequences.get(former.seq_name)
        if sequence is not None:
            sequence.alter_name(driver, self.seq_name)
        # Rename the surrogate key constraint.
        constraint = table.constraints.get(former.uk_name)
        if constraint is not None:
            constraint.alter_name(driver, self.uk_name)

    def purge(self, driver):
        # No-op.
        raise NotImplementedError()


