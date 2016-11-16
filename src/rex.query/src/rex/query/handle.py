#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob.exc import HTTPUnauthorized
from rex.web import HandleLocation, authorize, confine
from .database import Database


class HandleQueryLocation(HandleLocation):

    path = '/query/'

    def __call__(self, req):
        if not authorize(req, self):
            raise HTTPUnauthorized()
        db = Database()
        with confine(req, self):
            resp = db(req)
            # TODO: Need to decide on that before 1.0.0
            enable_cors(resp)
            return resp

def enable_cors(resp):
    resp.headers['Access-Control-Allow-Origin'] =  '*'
    resp.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept'
