#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error, BoolVal, UStrVal, OneOrSeqVal
from rex.deploy import (
        Fact, TableFact, ColumnFact, LinkFact, IdentityFact, mangle,
        sql_template, model, BEFORE, INSERT_UPDATE)


class LabelVal(UStrVal):
    # An entity label.

    pattern = r'[a-z_][0-9a-z_]*'


class QLabelVal(UStrVal):
    # An entity label with an optional qualifier.

    pattern = r'[a-z_][0-9a-z_]*([.][a-z_][0-9a-z_]*)?'


class TitleVal(UStrVal):
    # Entity title.

    pattern = r'\S(.*\S)?'


@sql_template
def plpgsql_file_container_procedure():
    """
    DECLARE
        _session text;
    BEGIN
        IF TG_OP = 'INSERT' THEN
            IF NEW.timestamp <> 'now'::text::timestamp THEN
                RAISE EXCEPTION 'file.timestamp cannot be directly assigned';
            END IF;
            IF NEW.fresh <> TRUE THEN
                RAISE EXCEPTION 'file.fresh cannot be directly assigned';
            END IF;
            IF NEW.session IS NOT NULL THEN
                RAISE EXCEPTION 'file.session cannot be directly assigned';
            END IF;
            BEGIN
                SELECT current_setting('rex.session') INTO _session;
            EXCEPTION WHEN undefined_object THEN
            END;
            IF _session IS NULL THEN
                SELECT session_user INTO _session;
            END IF;
            NEW.session := _session;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.handle <> OLD.handle THEN
                RAISE EXCEPTION 'file.handle cannot be modified';
            END IF;
            IF NEW.fresh <> OLD.fresh AND NEW.fresh <> FALSE THEN
                RAISE EXCEPTION 'file.fresh cannot be reset';
            END IF;
        END IF;
        RETURN NEW;
    END;
    """

@sql_template
def plpgsql_file_procedure(table_name, name, table_label, label):
    """
    DECLARE
        _session text;
        _file file%ROWTYPE;
    BEGIN
        IF NEW.{{ name|n }} IS NOT NULL
           AND (TG_OP = 'INSERT' OR
                TG_OP = 'UPDATE' AND NEW.{{ name|n }} IS DISTINCT FROM OLD.{{ name|n }}) THEN
            BEGIN
                SELECT current_setting('rex.session') INTO _session;
            EXCEPTION WHEN undefined_object THEN
            END;
            IF _session IS NULL THEN
                SELECT session_user INTO _session;
            END IF;
            SELECT * INTO _file FROM file WHERE file.id = NEW.{{ name|n }};
            IF NOT (_file.timestamp+'1d' > 'now'::text::timestamp AND
                    _file.session = _session AND
                    _file.fresh IS TRUE) THEN
                RAISE EXCEPTION '{{ table_label }}.{{ label }} cannot be set to ''%''', _file.handle;
            END IF;
            UPDATE file SET fresh = FALSE WHERE handle = _file.handle;
        END IF;
        RETURN NEW;
    END;
    """


class FileFact(Fact):

    fields = [
            ('file', QLabelVal),
            ('of', LabelVal, None),
            ('was', OneOrSeqVal(LabelVal), None),
            ('after', OneOrSeqVal(LabelVal), None),
            ('required', BoolVal, None),
            ('title', TitleVal, None),
            ('present', BoolVal, True),
    ]

    @classmethod
    def build(cls, driver, spec):
        if not spec.present:
            for field in ['was', 'after', 'required', 'title']:
                if getattr(spec, field) is not None:
                    raise Error("Got unexpected clause:", field)
        if u'.' in spec.file:
            table_label, label = spec.link.split(u'.')
            if spec.of is not None and spec.of != table_label:
                raise Error("Got mismatched table names:",
                            ", ".join((table_label, spec.of)))
        else:
            label = spec.file
            table_label = spec.of
            if spec.of is None:
                raise Error("Got missing table name")
        if isinstance(spec.was, list):
            former_labels = spec.was
        elif spec.was:
            former_labels = [spec.was]
        else:
            former_labels = []
        is_required = spec.required
        title = spec.title
        is_present = spec.present
        front_labels = spec.after
        if front_labels is None:
            front_labels = []
        elif not isinstance(front_labels, list):
            front_labels = [front_labels]
        return cls(table_label, label,
                   former_labels=former_labels, is_required=is_required,
                   title=title, front_labels=front_labels,
                   is_present=is_present)

    def __init__(self, table_label, label,
                 former_labels=[], is_required=None,
                 title=None, front_labels=[], is_present=True):
        assert isinstance(table_label, unicode) and len(table_label) > 0
        assert isinstance(label, unicode) and len(label) > 0
        assert isinstance(is_present, bool)
        if is_present:
            assert (isinstance(former_labels, list) and
                    all(isinstance(former_label, unicode)
                        for former_label in former_labels))
            if is_required is None:
                is_required = True
            assert isinstance(is_required, bool)
            assert (title is None or
                    (isinstance(title, unicode) and len(title) > 0))
            assert (isinstance(front_labels, list) and
                    all(isinstance(front_label, unicode)
                        for front_label in front_labels))
        else:
            assert former_labels == []
            assert is_required is None
            assert title is None
            assert front_labels == []
        self.table_label = table_label
        self.label = label
        self.former_labels = former_labels
        self.is_required = is_required
        self.title = title
        self.front_labels = front_labels
        self.is_present = is_present

    def __repr__(self):
        args = []
        args.append(repr(self.table_label))
        args.append(repr(self.label))
        if self.former_labels:
            args.append("former_labels=%r" % self.former_labels)
        if self.is_required is not None and self.is_required is not True:
            args.append("is_required=%r" % self.is_required)
        if self.title is not None:
            args.append("title=%r" % self.title)
        if self.front_labels:
            args.append("front_labels=%r" % self.front_labels)
        if not self.is_present:
            args.append("is_present=%r" % self.is_present)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        if self.is_present:
            schema = model(driver)
            driver(TableFact(u"file"))
            driver(ColumnFact(u"file", u"handle", type=u"text"))
            driver(IdentityFact(u"file", [u"handle"]))
            driver(ColumnFact(
                u"file", u"timestamp", type=u"datetime", default=u"now()"))
            driver(ColumnFact(u"file", u"session", type=u"text"))
            driver(ColumnFact(u"file", u"fresh", type=u"boolean", default=True))
            container_table = schema.table(u'file')
            chk_name = mangle(u'file', u'chk')
            type_image = schema.system_image.types[u'trigger']
            source = plpgsql_file_container_procedure()
            if (chk_name, ()) not in schema.image.procedures:
                procedure_image = schema.image.create_procedure(
                        chk_name, [], type_image, source)
                container_table.image.create_trigger(
                        chk_name, BEFORE, INSERT_UPDATE, procedure_image, [])
            link = LinkFact(
                    self.table_label, self.label, u"file",
                    former_labels=self.former_labels,
                    is_required=self.is_required,
                    title=self.title,
                    front_labels=self.front_labels)
            link(driver)
            table = schema.table(self.table_label)
            link = table.link(self.label)
            table_name = table.names(self.table_label).name
            link_name = link.names(self.table_label, self.label).name
            chk_name = mangle([table_name, link_name, u'file'], u'chk')
            source = plpgsql_file_procedure(
                    table_name, link_name, self.table_label, self.label)
            if (chk_name, ()) not in schema.image.procedures:
                procedure_image = schema.image.create_procedure(
                        chk_name, [], type_image, source)
                table.image.create_trigger(
                        chk_name, BEFORE, INSERT_UPDATE, procedure_image, [])
        else:
            link = LinkFact(
                    self.table_label, self.label, u"file", is_present=False)
            link(driver)


