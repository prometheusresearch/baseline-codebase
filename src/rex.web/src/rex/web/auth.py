#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Extension, cached


class Authenticate(Extension):

    def __call__(self, req):
        return req.remote_user


class Authorize(Extension):

    role = None

    @classmethod
    @cached
    def map_all(cls):
        mapping = {}
        for extension in cls.all():
            assert extension.role not in mapping, \
                    "duplicate role: %r" % extension.role
            mapping[extension.role] = extension
        return mapping

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
        auth_type = Authenticate.top()
        req.environ['rex.user'] = auth_type()(req)
    return req.environ['rex.user']


def authorize(req, role):
    if 'rex.roles' not in req.environ:
        req.environ['rex.roles'] = {}
    if role not in req.environ['rex.roles']:
        auth_type_map = Authorize.map_all()
        assert role in auth_type_map, "undefined role %r" % role
        auth_type = auth_type_map[role]
        req.environ['rex.roles'][role] = auth_type()(req)
    return req.environ['rex.roles'][role]


