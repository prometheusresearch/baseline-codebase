
from rex.widget_chrome import Chrome
from rex.core import cached, get_settings, get_packages
from rex.widget import computed_field
from rex.web import get_routes, url_for
from rex.action import Action

@cached
def source_url_map():
    menu = get_settings().menu
    ret = {}
    for level1 in menu:
        for item in level1.items:
            ret[item.url] = (item.wizard_source, item.action_source)
    return ret

def doc_url(req, url):
    if url is None:
        return None
    package = get_packages()[0]
    return url_for(req, '%s:/doc/%s.html' % (package.name, url))

def pkg_url(req):
    mount = req.environ['rex.mount']
    url = req.path_url
    for package_name, prefix in mount.items():
        if url.startswith(prefix):
            return '%s:%s' % (package_name, url[len(prefix):])
    assert False, 'Package not found for URL: %s' % url

def get_sources(req):
    return source_url_map().get(pkg_url(req), (None, {}))


class DemoChrome(Chrome):

    name = 'DemoChrome'
    js_type = 'rex-action-demo/lib/DemoChrome'

    @computed_field
    def wizard_source(self, req):
        wizard_source, _ = get_sources(req)
        return doc_url(req, wizard_source)

    @computed_field
    def action_source(self, req):
        _, action_source = get_sources(req)
        return dict([
            (id, doc_url(req, url)) for id, url in action_source.items()
        ])
