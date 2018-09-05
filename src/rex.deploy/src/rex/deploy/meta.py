#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import (
        Location, set_location, UStrVal, UChoiceVal, MaybeVal, SeqVal,
        RecordVal, Error)
from .fact import LabelVal, TitleVal, AliasVal, AliasSpec, FactDumper
from .image import TableImage, ColumnImage, UniqueKeyImage
import operator
import collections
import yaml


class MetaMeta(type):

    def __new__(mcls, name, bases, members):
        cls = type.__new__(mcls, name, bases, members)
        if cls.__dict__.get('fields'):
            if 'validate' not in cls.__dict__:
                cls.validate = RecordVal(cls.fields)
            for field in cls.fields:
                name = field[0]
                getter = operator.attrgetter("spec.%s" % name)
                setattr(cls, name, property(getter, doc=""))
        return cls


class Meta(metaclass=MetaMeta):
    """
    Database entity metadata.
    """

    __slots__ = ('spec', 'extra')

    fields = []
    validate = None

    @classmethod
    def parse(cls, text):
        """
        Generates entity metadata from the entity comment.
        """
        # Extract the comment text from an image object.
        if hasattr(text, 'comment'):
            text = text.comment
        # Attempt to parse the comment as a YAML stream.
        documents = None
        if text and text.startswith('---'):
            try:
                documents = list(yaml.safe_load_all(text))
            except yaml.YAMLError:
                pass
        # The metadata record.
        spec = None
        # Extra content stored in the comment.
        extra = None
        # Validate the metadata.
        if documents:
            try:
                spec = cls.validate(documents[0])
                extra = documents[1:] or None
            except Error:
                pass
        if spec is None:
            spec = cls.validate({})
            extra = text
        return cls(spec, extra)

    def dump(self):
        """
        Serializes metadata as a comment text.
        """
        # Metadata mapping with non-default values.
        mapping = {}
        for field in self.fields:
            name = field[0]
            value = getattr(self.spec, name)
            is_default = False
            if len(field) >= 3:
                default = field[2]
                is_default = (value == default)
            if not is_default:
                mapping[name] = value
        # If there are non-default values, serialize them in YAML.
        if mapping or isinstance(self.extra, list):
            documents = [mapping]
            if self.extra:
                if isinstance(self.extra, list):
                    documents.extend(self.extra)
                else:
                    documents.append(self.extra)
            text = yaml.dump_all(documents,
                                 Dumper=FactDumper,
                                 explicit_start=True,
                                 default_flow_style=False)
        # Otherwise, just store the extra content.
        else:
            text = self.extra
        return text

    def __init__(self, spec, extra=None):
        self.spec = spec
        self.extra = extra

    def update(self, **kwds):
        """
        Updates metadata; returns ``True`` if any fields have changed.
        """
        new_spec = self.spec.__clone__(**kwds)
        if new_spec == self.spec:
            return False
        self.spec = new_spec
        return True

    def __repr__(self):
        args = [repr(self.spec)]
        if self.extra is not None:
            args.append("extra=%r" % self.extra)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))


class TableMeta(Meta):
    """Table metadata."""

    __slots__ = ()

    fields = [
            ('label', LabelVal, None),
            ('title', TitleVal, None),
            ('aliases', SeqVal(AliasVal), []),
    ]


class ColumnMeta(Meta):
    """Column metadata."""

    __slots__ = ()

    fields = [
            ('label', LabelVal, None),
            ('title', TitleVal, None),
            ('default', UStrVal, None),
    ]


class PrimaryKeyMeta(Meta):
    """Metadata for primary key constraints."""

    __slots__ = ()

    fields = [
            ('generators',
             SeqVal(MaybeVal(UChoiceVal('offset', 'random'))), None),
    ]


def uncomment(image):
    """
    Returns entity metadata.
    """
    if isinstance(image, TableImage):
        return TableMeta.parse(image.comment)
    elif isinstance(image, ColumnImage):
        return ColumnMeta.parse(image.comment)
    elif isinstance(image, UniqueKeyImage) and image.is_primary:
        return PrimaryKeyMeta.parse(image.comment)
    raise NotImplementedError(image)


