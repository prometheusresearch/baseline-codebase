#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob.exc import HTTPUnauthorized
from rex.web import HandleLocation, authorize, confine
from .database import Database


class HandleQueryLocation(HandleLocation):

    path = '/'

    def __call__(self, req):
        if not authorize(req, self):
            raise HTTPUnauthorized()
        db = Database()
        with confine(req, self):
            return db(req)


