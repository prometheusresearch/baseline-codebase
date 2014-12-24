#
# Copyright (c) 2014, Prometheus Research, LLC
#


from rex.core import cached, Error
from rex.port import Port
from rex.attach import get_storage
from htsql.core.domain import TextDomain, IdentityDomain, Value, ID
import cgi


FileDomain = IdentityDomain([TextDomain()])
FileID = ID.make(FileDomain.dump)


class FileMap(object):

    def __init__(self, table_name, link_name):
        self.owner_port = get_owner_port(table_name, link_name)
        self.owner_table = next(iter(self.owner_port.tree))
        self.owner_link = next(iter(next(iter(self.owner_port.tree.values()))))
        self.file_port = get_file_port()

    def __repr__(self):
        return "%s(%r, %r)" % (self.__class__.__name__,
                               self.owner_table, self.owner_link)

    def get(self, identity):
        owner_data = self.owner_port.produce(('*', identity)).data
        if not owner_data[0]:
            raise Error("Cannot find record:",
                        "%s[%s]" % (self.owner_table, identity))
        owner_record = owner_data[0][0]
        identity = owner_record[0]
        handle = owner_record[1]
        if handle is not None:
            constraint = ('*', None, [Value(FileDomain, handle)])
            handle = handle[0]
            file_data = self.file_port.produce(constraint).data
            assert file_data[0]
            file_record = file_data[0][0]
            if (file_record.owner_table != self.owner_table or
                file_record.owner_link != self.owner_link or
                file_record.owner_identity != str(identity)):
                raise Error("Got link to a stolen file:",
                            "%s[%s]" % (self.owner_table, identity))
        return File(self, identity, handle)

    def remove(self, identity, handle):
        old_owner_data = [(identity, FileID([handle]))]
        new_owner_data = [(identity, None)]
        self.owner_port.replace(old_owner_data, new_owner_data)
        old_file_data = [(FileID([handle]), handle,
                          self.owner_table, self.owner_link,
                          str(identity))]
        new_file_data = []
        self.file_port.replace(old_file_data, new_file_data)

    def add(self, identity, handle):
        old_file_data = []
        new_file_data = [(None, handle,
                          self.owner_table, self.owner_link,
                          str(identity))]
        self.file_port.replace(old_file_data, new_file_data)
        old_owner_data = [(identity, None)]
        new_owner_data = [(identity, FileID([handle]))]
        self.owner_port.replace(old_owner_data, new_owner_data)


class File(object):

    def __init__(self, file_map, identity, handle):
        self.file_map = file_map
        self.identity = identity
        self.handle = handle

    def __repr__(self):
        return "%s(%r, %r, %r)" % (self.__class__.__name__,
                                   self.file_map, self.identity, self.handle)

    def exists(self):
        return (self.handle is not None)

    def open(self):
        assert self.handle is not None
        storage = get_storage()
        return storage.open(self.handle)

    def stat(self):
        assert self.handle is not None
        storage = get_storage()
        return storage.stat(self.handle)

    def abspath(self):
        assert self.handle is not None
        storage = get_storage()
        return storage.abspath(self.handle)

    def download(self):
        assert self.handle is not None
        storage = get_storage()
        return storage.route(self.handle)

    def upload(self, attachment, content=None):
        assert self.handle is None
        if content is not None:
            name = attachment
        elif isinstance(attachment, cgi.FieldStorage):
            name, content = attachment.filename, attachment.file
        else:
            name, content = attachment
        storage = get_storage()
        handle = storage.add(name, content)
        self.file_map.add(self.identity, handle)
        self.handle = handle

    def remove(self):
        assert self.handle is not None
        storage = get_storage()
        storage.remove(self.handle)
        self.file_map.remove(self.identity, self.handle)
        self.handle = None


def get_file(table_name, identity, link_name='file'):
    file_map = get_file_map(table_name, link_name)
    return file_map.get(identity)


@cached
def get_file_map(table_name, link_name='file'):
    return FileMap(table_name, link_name)


@cached
def get_file_port():
    return Port({'entity': 'file'})


@cached
def get_owner_port(table_name, link_name):
    owner_port = Port({'entity': table_name, 'select': [link_name]})
    file_port = get_file_port()
    file_arm = next(iter(file_port.tree.values()))
    table_arm = next(iter(owner_port.tree.values()), None)
    column_arm = next(iter(table_arm.values()), None)
    if column_arm is None or column_arm.node != file_arm.node:
        raise Error("Expected a link to the file table; got:",
                    "%s.%s" % (table_name, link_name))
    return owner_port


