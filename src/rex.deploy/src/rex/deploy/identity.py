#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, MaybeVal, UChoiceVal, SeqVal
from .fact import Fact, LabelVal, QLabelVal, PairVal
from .model import model
import collections


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
                            MaybeVal(UChoiceVal('offset', 'random', 'uuid'))))),
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
            if '.' in label:
                current_table_label = table_label
                table_label, label = label.split('.')
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
        assert isinstance(table_label, str) and len(table_label) > 0
        assert (isinstance(labels, list) and len(labels) > 0 and
                all(isinstance(label, str) for label in labels) and
                len(set(labels)) == len(labels))
        if generators is None:
            generators = [None]*len(labels)
        assert (isinstance(generators, list) and
                len(generators) == len(labels) and
                all(generator in (None, 'offset', 'random', 'uuid')
                    for generator in generators))
        self.table_label = table_label
        self.labels = labels
        self.generators = generators

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.labels))
        if any(generator is not None for generator in self.generators):
            args.append(repr(self.generators))
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def to_yaml(self, full=True):
        mapping = collections.OrderedDict()
        items = []
        for label, generator in zip(self.labels, self.generators):
            if generator is not None:
                items.append({label: generator})
            else:
                items.append(label)
        mapping['identity'] = items
        if full:
            mapping['of'] = self.table_label
        return mapping

    def __call__(self, driver):
        schema = model(driver)
        table = schema.table(self.table_label)
        if not table:
            raise Error("Discovered missing table:", self.table_label)
        fields = []
        for label in self.labels:
            column = table.column(label)
            link = table.link(label)
            if column:
                fields.append(column)
            elif link:
                fields.append(link)
            else:
                raise Error("Discovered missing field:", label)
        identity = table.identity()
        if identity:
            identity.modify(
                    fields=fields,
                    generators=self.generators)
        else:
            table.build_identity(
                    fields=fields,
                    generators=self.generators)


