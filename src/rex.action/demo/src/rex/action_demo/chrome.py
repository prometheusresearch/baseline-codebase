
from rex.widget_chrome.menu import Chrome
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
            ret[item.url] = (item.inspect,
                             item.wizard_source,
                             item.action_source)
    return ret

def doc_url(req, url):
    if url is None:
        return None
    package = get_packages()[0]
    return url_for(req, '%s:/doc/%s' % (package.name, url))

def pkg_url(req):
    mount = req.environ['rex.mount']
    url = req.path_url
    for package_name, prefix in list(mount.items()):
        if url.startswith(prefix):
            return '%s:%s' % (package_name, url[len(prefix):])
    assert False, 'Package not found for URL: %s' % url

def get_sources(req):
    return source_url_map().get(pkg_url(req), (False, None, {}))


class DemoChrome(Chrome):

    name = 'DemoChrome'
    js_type = 'rex-action-demo', 'DemoChrome'

    @computed_field
    def wizard_source(self, req):
        _, wizard_source, _ = get_sources(req)
        return doc_url(req, wizard_source)

    @computed_field
    def action_source(self, req):
        _, _, action_source = get_sources(req)
        return dict([
            (id, doc_url(req, url)) for id, url in list(action_source.items())
        ])

    @computed_field
    def inspect_url(self, req):
        inspect, _, _ = get_sources(req)
        if inspect:
            url = pkg_url(req)
            return ('action/inspect#/list-action.context[path=%s]/view-action'
                    % url.replace('/', '\\/'))
        return None
