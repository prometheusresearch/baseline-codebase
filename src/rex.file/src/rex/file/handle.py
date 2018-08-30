#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error
from rex.attach import get_storage
from rex.web import HandleLocation, authorize, confine
from rex.db import get_db
from webob import Response
from webob.exc import HTTPUnauthorized
import cgi


class HandleUpload(HandleLocation):
    """
    Stores uploaded files in the ``rex.attach`` storage with file handles
    in the ``file`` table.

    Returns a JSON object mapping each file to its handle.
    """

    path = '/'

    def __call__(self, req):
        if not authorize(req, self):
            raise HTTPUnauthorized()
        with confine(req, self):
            inputs = {}
            for key, value in list(req.params.items()):
                if isinstance(value, cgi.FieldStorage):
                    if key in inputs:
                        error = Error("Received duplicate upload name:", key)
                        return req.get_response(error)
                    inputs[key] = value
            storage = get_storage()
            db = get_db()
            outputs = {}
            for key, attachment in sorted(inputs.items()):
                handle = storage.add(attachment.filename, attachment.file)
                product = db.produce("insert(file:={handle:=$handle})",
                                     handle=handle)
                outputs[key] = str(product.data)
            return Response(json=outputs)


