#
# Copyright (c) 2016, Prometheus Research, LLC
#


from rex.core import Extension, StrVal
from rex.web import PathMask, authorize, confine
from webob.exc import HTTPUnauthorized, HTTPTemporaryRedirect


class Menu(Extension):
    """
    Registers a new type of a page handler for use in menu definitions.

    `path`
        The URL under which the page is defined in the menu.
    `access`
        Access permissions.
    `value`
        Custom page data.
    """

    #: Field name that is used to recognize the type of the page.
    key = None
    #: Validator for this field.
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
        """
        Renders the page.
        """
        if not authorize(req, self):
            raise HTTPUnauthorized()
        with confine(req, self):
            return self.render(req)

    def masks(self):
        """
        Returns a list of path masks handled by the page.
        """
        return [self.mask]

    def render(self, req):
        """
        Renders the page assuming the request passes access control.

        Must be overridden in subclasses.
        """
        raise NotImplementedError()

    def __repr__(self):
        return "%s(%r, %r, %r)" % \
                (self.__class__.__name__, self.path, self.access, self.value)


class ExternalMenu(Menu):

    key = 'external'
    validate = StrVal(r'\w+\:\S*')

    def render(self, req):
        return HTTPTemporaryRedirect(location=self.value)


