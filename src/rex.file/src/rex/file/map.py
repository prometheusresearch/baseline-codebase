#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error, guard, locate, StrVal, BoolVal
from rex.web import authorize, trusted, confine
from rex.urlmap import Map
from rex.port import Port
from rex.attach import get_storage
from webob.exc import HTTPNotFound, HTTPUnauthorized, HTTPForbidden


class FileVal(StrVal):

    pattern = r'[A-Za-z_][0-9A-Za-z_]*(\.[A-Za-z_][0-9A-Za-z_]*)?'


class MapFile(Map):

    fields = [
            ('file', FileVal),
            ('access', StrVal, None),
            ('unsafe', BoolVal, False),
    ]

    def __call__(self, spec, path, context):
        table = spec.file
        link = 'file'
        if '.' in table:
            table, link = table.split('.')
        with guard("While creating file:", locate(spec)):
            port = Port({'entity': table, 'select': [link]})
        access = spec.access or self.package.name
        unsafe = spec.unsafe
        return FileRenderer(
                port=port,
                access=access,
                unsafe=unsafe)

    def override(self, spec, override_spec):
        if override_spec.file is not None:
            spec = spec.__clone__(file=override_spec.file)
        if override_spec.access is not None:
            spec = spec.__clone__(access=override_spec.access)
        if override_spec.unsafe is not None:
            spec = spec.__clone__(unsafe=override_spec.unsafe)
        return spec


class FileRenderer(object):

    def __init__(self, port, access, unsafe):
        self.port = port
        self.access = access
        self.unsafe = unsafe

    def __call__(self, req):
        self.authorize(req)
        with confine(req, self):
            try:
                identity = req.query_string
                data = self.port.produce(('*', identity)).data[0]
                if not data:
                    raise HTTPNotFound()
                handle_id = data[0][1]
                if not handle_id:
                    raise HTTPNotFound()
                handle = handle_id[0]
                storage = get_storage()
                return storage.route(handle)(req)
            except Error as error:
                return req.get_response(error)

    def authorize(self, req):
        if not authorize(req, self.access):
            raise HTTPUnauthorized()
        if self.unsafe and not trusted(req):
            raise HTTPForbidden()


