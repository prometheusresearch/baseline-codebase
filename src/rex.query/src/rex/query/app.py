#
# Copyright (c) 2016, Prometheus Research, LLC
#


import os.path
import json
import collections
import pkg_resources

from webob import Response
from webob.exc import HTTPNotFound

from rex.core import get_packages
from rex.web import Command, render_to_response


Bundle = collections.namedtuple('Bundle', ['root', 'js', 'css'])


def find_bundle(path='bundle'):
    packages = get_packages()
    manifest_path = os.path.join('www', path, 'asset-manifest.json')
    js = None
    css = None
    for package in packages:
        exists = package.exists(manifest_path)
        if not exists:
            continue
        with package.open(manifest_path) as f:
            manifest = json.load(f)
        dist = pkg_resources.get_distribution(package.name)
        root = '%s:%s' % (package.name, path)
        if 'main.css' in manifest:
            css = '%s:%s/%s' % (
                package.name,
                path,
                manifest['main.css']
            )
        if 'main.js' in manifest:
            js = '%s:%s/%s' % (
                package.name,
                path,
                manifest['main.js']
            )
        return Bundle(root=root, js=js, css=css)


class RenderApp(Command):

    template = 'rex.query:/templates/index.html'

    def render(self, req):
        bundle = find_bundle()
        if not bundle:
            raise HTTPNotFound()
        return render_to_response(
            self.template, req,
            bundle=bundle
        )


class RenderQuery(RenderApp):

    path = '/'
