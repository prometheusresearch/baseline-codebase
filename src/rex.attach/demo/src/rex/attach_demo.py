
from rex.core import StrVal
from rex.web import Command, Parameter, render_to_response
from rex.attach import AttachmentVal, upload, download
from rex.db import get_db
from webob import Response
from webob.exc import HTTPBadRequest, HTTPNotFound


class IndexCmd(Command):

    path = '/'
    access = 'anybody'
    template = 'rex.attach_demo:/template/index.html'

    def render(self, req):
        db = get_db()
        files = db.produce('/file{code, title}')
        return render_to_response(self.template, req, files=files)


class UploadCmd(Command):

    path = '/upload'
    access = 'anybody'
    parameters = [
            Parameter('code', StrVal(r'\w+')),
            Parameter('title', StrVal(r'.+')),
            Parameter('attachment', AttachmentVal()),
    ]

    def render(self, req, code, title, attachment):
        db = get_db()
        if db.produce('file[$code]', code=code):
            raise HTTPBadRequest("duplicate file code")
        handle = upload(attachment)
        db.produce(
                'insert(file:={code:=$code, title:=$title, handle:=$handle})',
                code=code, title=title, handle=handle)
        return Response(status=302, location=req.application_url)


class DownloadCmd(Command):

    path = '/download'
    access = 'anybody'
    parameters = [
            Parameter('code', StrVal(r'\w+')),
    ]

    def render(self, req, code):
        db = get_db()
        handle = db.produce('file[$code].handle', code=code).data
        if handle is None:
            raise HTTPNotFound("invalid file code")
        return download(handle)(req)


