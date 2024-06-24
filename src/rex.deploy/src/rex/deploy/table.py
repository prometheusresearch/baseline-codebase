#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, StrVal, SeqVal, OneOrSeqVal, locate
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


class ViewFact(Fact):
    """
    Describes a view.

    `label`: ``unicode``
        The name of the view.
    `former_labels`: [``unicode``]
        Names that the view may have had in the past.
    `title`: ``unicode`` or ``None``
        The title of the view.  If not set, generated from the label.
    `is_present`: ``bool``
        Indicates whether the view exists in the database.
    `related`: [:class:`Fact`] or ``None``
        Facts to be deployed when the view is deployed.  Could be specified
        only when ``is_present`` is ``True``.
    `definition`: ``unicode``
        SQL definition of the view.
    """

    fields = [
            ('view', LabelVal),
            ('definition', StrVal(), None),
            ('was', OneOrSeqVal(LabelVal), None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if not spec.present:
            for field in ['was', 'title', 'definition']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
        label = spec.view
        definition = spec.definition
        is_present = spec.present
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        title = spec.title
        after = []
        return cls(label, former_labels=former_labels,
                   title=title, definition=definition,
                   is_present=is_present)

    def __init__(self, label, definition=None, former_labels=[],
                 title=None, is_present=True):
        # Validate input constraints.
        assert isinstance(label, str) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, str)
                        for former_label in former_labels))
            assert (title is None or
                    (isinstance(title, str) and len(title) > 0))
        else:
            assert former_labels == []
            assert title is None
        self.label = label
        self.definition = definition
        self.former_labels = former_labels
        self.title = title
        self.is_present = is_present

    def __repr__(self):
        args = []
        args.append(repr(self.label))
        if self.definition:
            args.append("definition=%r" % self.definition)
        if self.former_labels:
            args.append("former_labels=%r" % self.former_labels)
        if self.title is not None:
            args.append("title=%r" % self.title)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def to_yaml(self, full=True):
        mapping = collections.OrderedDict()
        mapping['view'] = self.label
        if self.former_labels:
            mapping['was'] = self.former_labels
        if self.title is not None:
            mapping['title'] = self.title
        if self.is_present is False:
            mapping['present'] = self.is_present
        if full and self.definition:
            mapping['definition'] = self.definition
        return mapping

    def __call__(self, driver):
        schema = model(driver)
        view = schema.view(self.label)
        if not view:
            for former_label in self.former_labels:
                view = schema.view(former_label)
                if view:
                    break
        if self.is_present:
            if view:
                if self.definition is None or view.definition == self.definition:
                    view.modify(
                            label=self.label,
                            title=self.title)
                else:
                    view.erase()
                    schema.build_view(
                            label=self.label,
                            definition=self.definition,
                            title=self.title)
            else:
                schema.build_view(
                        label=self.label,
                        definition=self.definition,
                        title=self.title)
        else:
            if view:
                view.erase()
