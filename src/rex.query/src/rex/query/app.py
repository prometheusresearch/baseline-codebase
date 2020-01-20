#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound

from rex.web import Command, render_to_response, get_assets_bundle
from .extension import Chart

__all__ = ('RenderApp',)


class RenderApp(Command):

    template = 'rex.query:/templates/index.html'

    def render(self, req):
        bundle = get_assets_bundle()
        return render_to_response(
            self.template, req,
            bundle=bundle
        )
