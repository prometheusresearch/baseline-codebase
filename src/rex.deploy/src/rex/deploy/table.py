#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, SeqVal, OneOrSeqVal, locate
from .fact import Fact, FactVal, LabelVal, TitleVal
from .model import model
import collections


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
        after = []
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
                    if after and \
                            related_spec.after is None and \
                            related_spec.present is not False:
                        related_spec = related_spec.__clone__(after=after[:])
                related_fact = driver.build(related_spec)
                related.append(related_fact)
                if (getattr(related_fact, 'label', None) and
                        getattr(related_fact, 'is_present', False)):
                    after.append(related_fact.label)
        return cls(label, former_labels=former_labels,
                   is_reliable=is_reliable, title=title,
                   is_present=is_present, related=related)

    def __init__(self, label, former_labels=[], is_reliable=None,
                 title=None, is_present=True, related=None):
        # Validate input constraints.
        assert isinstance(label, str) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, str)
                        for former_label in former_labels))
            if is_reliable is None:
                is_reliable = True
            assert isinstance(is_reliable, bool)
            assert (title is None or
                    (isinstance(title, str) and len(title) > 0))
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

    def to_yaml(self, full=True):
        mapping = collections.OrderedDict()
        mapping['table'] = self.label
        if self.former_labels:
            mapping['was'] = self.former_labels
        if self.is_reliable is False:
            mapping['reliable'] = self.is_reliable
        if self.title is not None:
            mapping['title'] = self.title
        if self.is_present is False:
            mapping['present'] = self.is_present
        if full and self.related:
            mapping['with'] = [
                    item.to_yaml(full=False)
                    for item in self.related]
        return mapping

    def __call__(self, driver):
        schema = model(driver)
        table = schema.table(self.label)
        if not table:
            for former_label in self.former_labels:
                table = schema.table(former_label)
                if table:
                    break
        if self.is_present:
            if table:
                table.modify(
                        label=self.label,
                        is_reliable=self.is_reliable,
                        title=self.title)
            else:
                schema.build_table(
                        label=self.label,
                        is_reliable=self.is_reliable,
                        title=self.title)
        else:
            if table:
                table.erase()
        # Apply nested facts.
        if self.related:
            driver(self.related)


