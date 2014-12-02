#
# Copyright (c) 2013-2014, Prometheus Research, LLC
#


from rex.core import (Extension, cached, Package, get_packages, Setting,
        get_settings, StrVal, ChoiceVal, MapVal)


class AccessSetting(Setting):
    """
    Access table with permissions required to access package resources.

    For each package, this setting specifies the default permission required
    to access package commands, static files and other resources via HTTP.

    Example::

        access:
            rex.web_demo:   anybody

    It is not an error to omit some packages or the whole setting entirely.
    If the permission for a package is not specified, *authenticated*
    permission is assumed.

    Access tables defined by different packages are merged into one table.
    """

    name = 'access'

    def merge(self, old_value, new_value):
        # Verify and merge dictionaries.
        map_val = MapVal()
        value = {}
        value.update(map_val(old_value))
        value.update(map_val(new_value))
        return value

    def default(self):
        return self.validate({})

    def validate(self, value):
        # All packages.
        package_names = [package.name for package in get_packages()]
        # Check if the raw setting value is well-formed.
        mount_val = MapVal(ChoiceVal(*package_names), StrVal())
        value = mount_val(value)
        # Rebuild the access table.
        access = dict((name, value.get(name))
                      for name in package_names)
        return access


class Authenticate(Extension):
    """
    Authentication interface.

    Authentication is a mechanism for finding the user who initiated the HTTP
    request.  The default implementation returns the value of CGI variable
    ``REMOTE_USER``, but most applications are expected to provide a custom
    implementation.
    """

    def __call__(self, req):
        """
        Returns the user who performed the request or ``None``.

        Implementations should override this method.
        """
        return req.remote_user


class Authorize(Extension):
    """
    Authorization interface.

    Authorization is mechanism for checking whether the request has enough
    permission to execute some action.

    The following permissions are predefined:

    *authenticated*
        Granted when the request is authenticated.
    *anybody*
        Always granted.
    *nobody*
        Never granted.

    An application can define additional permissions by implementing this
    interface.
    """

    #: Permission name.
    access = None

    @classmethod
    def signature(cls):
        # For `cls.mapped()`.
        return cls.access

    # Deprecated.
    map_all = classmethod(Extension.mapped.__func__)

    @classmethod
    def enabled(cls):
        # Whether it is a complete implementation.
        return (cls.access is not None)

    def __call__(self, req):
        """
        Returns ``True`` if the request has the respective permission;
        ``False`` otherwise.

        Implementations must override this method.
        """
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)


class AuthorizeAuthenticated(Authorize):
    # This permission is granted if the request is authenticated.

    access = 'authenticated'

    def __call__(self, req):
        return (authenticate(req) is not None)


class AuthorizeAnybody(Authorize):
    # This permission is always granted.

    access = 'anybody'

    def __call__(self, req):
        return True


class AuthorizeNobody(Authorize):
    # This permission is never granted.

    access = 'nobody'

    def __call__(self, req):
        return False


def authenticate(req):
    """
    Returns the user who performed the request or ``None``.
    """
    # Since authentication could be expensive (e.g. database access),
    # we cache the result in `environ['rex.user']`.
    if 'rex.user' not in req.environ:
        auth_type = Authenticate.top()
        req.environ['rex.user'] = auth_type()(req)
    return req.environ['rex.user']


def authorize(req, access, default='authenticated'):
    """
    Returns whether the request has the given permission.

    `access` is one of:

    - the name of the permission;
    - the name of a package or a :class:`rex.core.Package` object, which implies
      package permission defined with the ``access`` setting;
    - an object with attributes ``access`` or ``package`` containing
      respectively the permission name or the package that owns the object.
    """
    # Maybe the permission name is set by the `access` or `package` attributes?
    for attr in ('access', 'package'):
        value = getattr(access, attr, None)
        if callable(value) and not isinstance(value, Package):
            value = value()
        if value is not None:
            access = value
            break
    # Is it a package object?
    if isinstance(access, Package):
        access = access.name
    # Resolve a package name to a concrete permission.
    packages = get_packages()
    settings = get_settings()
    seen = set()
    while access in packages:
        assert access not in seen, \
                "detected a loop in access setting: %s" % sorted(seen)
        seen.add(access)
        access = settings.access.get(packages[access].name)
    if access is None:
        access = default
    assert isinstance(access, str), repr(access)
    # Since authorization could be expensive (e.g. database access),
    # we cache the result in `environ['rex.access']`.
    if 'rex.access' not in req.environ:
        req.environ['rex.access'] = {}
    if access not in req.environ['rex.access']:
        auth_type_map = Authorize.mapped()
        assert access in auth_type_map, "undefined permission %r" % access
        auth_type = auth_type_map[access]
        req.environ['rex.access'][access] = auth_type()(req)
    return req.environ['rex.access'][access]


