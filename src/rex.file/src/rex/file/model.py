#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import UStrVal, Error
from rex.deploy import (
        ConstraintModel, Meta, LabelVal, mangle, BEFORE, INSERT_UPDATE,
        TriggerImage)
from .sql import plpgsql_file_table_check, plpgsql_file_link_check


class FileTableMeta(Meta):

    fields = [
            ('file', UStrVal('-'), None),
    ]


class FileLinkMeta(Meta):

    fields = [
            ('file', LabelVal(), None),
    ]


class FileTableConstraintModel(ConstraintModel):

    __slots__ = ('table', 'procedure_image')

    properties = []

    class names:

        __slots__ = ('name')

        def __init__(self):
            self.name = mangle('file', 'chk')

    @classmethod
    def recognizes(cls, schema, image):
        if not isinstance(image, TriggerImage):
            return False
        meta = FileTableMeta.parse(image)
        if meta.file is None:
            return False
        return True

    @classmethod
    def do_build(cls, table):
        if table.label != 'file':
            raise Error("Discovered unexpected table:", table.label)
        schema = table.schema
        names = cls.names()
        type_image = schema.system_image.types['trigger']
        source = plpgsql_file_table_check()
        procedure_image = schema.image.create_procedure(
                names.name, [], type_image, source)
        image = table.image.create_trigger(
                names.name, BEFORE, INSERT_UPDATE, procedure_image, [])
        meta = FileTableMeta.parse(image)
        meta.update(file='-')
        image.alter_comment(meta.dump())
        return cls(schema, image)

    def __init__(self, schema, image):
        super(FileTableConstraintModel, self).__init__(schema, image)
        self.table = schema(image.table)
        self.procedure_image = self.image.procedure

    def do_modify(self):
        pass

    def do_erase(self):
        if self.image:
            self.image.drop()
        if self.procedure_image:
            self.procedure_image.drop()

    def do_react(self, master, signal, old, new):
        if master is self.table:
            if signal.before_modify and new.label != 'file':
                raise Error("Cannot rename table:", old.label)
            if signal.after_erase:
                self.do_erase()


class FileLinkConstraintModel(ConstraintModel):

    __slots__ = ('link', 'procedure_image')

    properties = []

    class names:

        __slots__ = ('name')

        def __init__(self, table_label, label):
            self.name = mangle([table_label, label, 'file'], 'chk')

    @classmethod
    def recognizes(cls, schema, image):
        if not isinstance(image, TriggerImage):
            return False
        meta = FileLinkMeta.parse(image)
        if meta.file is None:
            return False
        return True

    @classmethod
    def do_build(cls, link):
        if link.target_table.label != 'file':
            raise Error("Discovered unexpected link:", link.label)
        schema = link.schema
        names = cls.names(link.table.label, link.label)
        type_image = schema.system_image.types['trigger']
        source = plpgsql_file_link_check(
                link.table.image.name, link.image.name,
                "%s.%s" % (link.table.label, link.label))
        procedure_image = schema.image.create_procedure(
                names.name, [], type_image, source)
        image = link.table.image.create_trigger(
                names.name, BEFORE, INSERT_UPDATE, procedure_image, [])
        meta = FileLinkMeta.parse(image)
        meta.update(file=link.label)
        image.alter_comment(meta.dump())
        return cls(schema, image)

    def __init__(self, schema, image):
        super(FileLinkConstraintModel, self).__init__(schema, image)
        meta = FileLinkMeta.parse(image)
        table = schema(image.table)
        self.link = table.link(meta.file)
        self.procedure_image = self.image.procedure

    def do_modify(self):
        pass

    def do_erase(self):
        if self.image:
            self.image.drop()
        if self.procedure_image:
            self.procedure_image.drop()

    def do_react(self, master, signal, old, new):
        if signal.after_modify and old.label != new.label:
            if self.link.target_table.label != 'file':
                return
            names = self.names(self.link.table.label, self.link.label)
            self.image.alter_name(names.name)
            self.procedure_image.alter_name(names.name)
            source = plpgsql_file_link_check(
                    self.link.table.image.name, self.link.image.name,
                    "%s.%s" % (self.link.table.label, self.link.label))
            self.procedure_image.alter_source(source)
        if signal.after_erase and \
                (master is self.link or master is self.link.table):
            if self.image:
                self.image.drop()
            if self.procedure_image:
                self.procedure_image.drop()
            self.remove()


