#
# Copyright (c) 2014, Prometheus Research, LLC
#
from rex.web import authenticate, Command, Parameter
from webob import Response
from webob.exc import HTTPConflict

class VersionsRequest(Command):

    path='/package_versions'

    parameters = [
        ]

    def render(self, req):
        import pip
        buildInfo = "<div><h3>Application Built Using ...</h3>"
        buildInfo +="<table>"
        for p in pip.get_installed_distributions():
            buildInfo +="<tr><td>"+p.key+"</td><td>"+p.version+"</td></tr>"
        buildInfo +="</table>"
        buildInfo +="</div>"

        return Response(content_type='text/html',
                            body=buildInfo)



