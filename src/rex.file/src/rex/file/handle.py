#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Error
from rex.web import HandleLocation, authorize, confine
from webob import Response
from webob.exc import HTTPUnauthorized
import cgi

from .util import save_file


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
            outputs = {}
            for key, attachment in sorted(inputs.items()):
                outputs[key] = save_file(attachment.filename, attachment.file)
            return Response(json=outputs)

