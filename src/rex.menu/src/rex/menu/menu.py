#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Extension, StrVal
from rex.web import PathMask, authorize, confine
from rex.action import ActionRenderer
from rex.action.action import ActionVal
from rex.widget import WidgetVal
from rex.widget.map import WidgetRenderer
from webob.exc import HTTPUnauthorized, HTTPTemporaryRedirect


class Menu(Extension):

    key = None
    validate = None

    @classmethod
    def enabled(cls):
        return (cls.key is not None and cls.validate is not None)

    @classmethod
    def signature(cls):
        return cls.key

    def __init__(self, path, access, value):
        self.path = path
        self.access = access
        self.value = value
        self.mask = PathMask(self.path)

    def __call__(self, req):
        if not authorize(req, self):
            raise HTTPUnauthorized()
        with confine(req, self):
            return self.render(req)

    def masks(self):
        return [self.mask]

    def render(self, req):
        raise NotImplementedError()

    def __repr__(self):
        return "%s(%r, %r, %r)" % \
                (self.__class__.__name__, self.path, self.access, self.value)


class ActionMenu(Menu):

    key = 'action'
    validate = ActionVal(id='')

    def __init__(self, path, access, value):
        super(ActionMenu, self).__init__(path, access, value)
        self.render = ActionRenderer(
                self.masks(), self.value, self.access, None)

    def masks(self):
        sanitized_path = self.path
        if sanitized_path.endswith('/'):
            sanitized_path = sanitized_path[:-1]
        return [
            PathMask(self.path),
            PathMask('%s/@@/{path:*}' % sanitized_path),
            PathMask('%s/@/{action:*}' % sanitized_path),
        ]


class WidgetMenu(Menu):

    key = 'widget'
    validate = WidgetVal()

    def __init__(self, path, access, value):
        super(WidgetMenu, self).__init__(path, access, value)
        self.render = WidgetRenderer(
                self.masks(), lambda: self.value, self.access)

    def masks(self):
        if self.path.endswith('/'):
            sub_path = '%s@@/{path:*}' % self.path
        else:
            sub_path = '%s/@@/{path:*}' % self.path
        return [
            PathMask(self.path),
            PathMask(sub_path),
        ]


class ExternalMenu(Menu):

    key = 'external'
    validate = StrVal(r'\w+\:\S*')

    def render(self, req):
        return HTTPTemporaryRedirect(location=self.value)


