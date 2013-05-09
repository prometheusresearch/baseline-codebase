#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Extension, cached


class Authenticate(Extension):

    @classmethod
    @cached
    def one(cls):
        return cls.all()[0]

    def __call__(self, req):
        return req.session.get('user')


class Authorize(Extension):

    role = None

    @classmethod
    @cached
    def by_role(cls, role):
        for extension in cls.all():
            if extension.role == role:
                return extension

    @classmethod
    def enabled(cls):
        return (cls.role is not None)

    def __call__(self, req):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class AuthorizeAuthenticated(Authorize):

    role = 'authenticated'

    def __call__(self, req):
        return (authenticate(req) is not None)


class AuthorizeAnybody(Authorize):

    role = 'anybody'

    def __call__(self, req):
        return True


class AuthorizeNobody(Authorize):

    role = 'nobody'

    def __call__(self, req):
        return False


def authenticate(req):
    if 'rex.user' not in req.environ:
        auth_type = Authenticate.one()
        req.environ['rex.user'] = auth_type()(req)
    return req.environ['rex.user']


def authorize(req, role):
    if 'rex.roles' not in req.environ:
        req.environ['rex.roles'] = {}
    if role not in req.environ['rex.roles']:
        auth_type = Authorize.by_role(role)
        assert auth_type is not None, "undefined role %r" % role
        req.environ['rex.roles'][role] = auth_type()(req)
    return req.environ['rex.roles'][role]


