#
# Copyright (c) 2016, Prometheus Research, LLC
#


from webob.exc import HTTPNotFound

from rex.web import Command, render_to_response, find_assets_bundle

__all__ = ('RenderApp',)


class RenderApp(Command):

    template = 'rex.query:/templates/index.html'

    def render(self, req):
        bundle = find_assets_bundle()
        if not bundle:
            raise HTTPNotFound()
        return render_to_response(
            self.template, req,
            bundle=bundle
        )
