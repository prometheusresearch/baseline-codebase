#
# Copyright (c) 2013-2015, Prometheus Research, LLC
#


from rex.core import (
        cached, get_packages, get_settings, Setting, MaybeVal, StrVal, MapVal,
        OneOrSeqVal)
from rex.web import authenticate, Authenticate, Authorize, Confine
from .database import get_db


class UserQuerySetting(Setting):
    """
    The `user_query` parameter is an HTSQL query that checks
    if the user is authenticated with the application.

    The user name is passed to the query as the `$USER` variable.
    If the user is known to the application, the query must return
    a `TRUE` value; otherwise, it can return `FALSE` or `NULL`.

    Example::

        user_query: user[$USER].(is_null(expires)|expires>now())
    """

    name = 'user_query'
    default = None
    validate = MaybeVal(StrVal)


class AutoUserQuerySetting(Setting):
    """
    The `auto_user_query` parameter allows you to authenticate users
    that are not registered in the database.

    This query is executed if the application failed to find the user
    in the database with the `user_query` query.  The query should return
    a name under which the user should be authenticated.  In particular,
    the query can add a new user entry to the database.

    The submitted user name is passed to the query as the `$USER` variable.

    Example::

        auto_user_query:
          do(insert(user:={remote_user:=$USER,guest:=true}), $USER)
    """

    name = 'auto_user_query'
    default = None
    validate = MaybeVal(StrVal)


class HTSQLEnvironmentSetting(Setting):
    """
    Configures user-specific query variables.

    The `htsql_environment` parameter is a mapping from variable names
    to HTSQL queries.  When a variable is used in an HTSQL expression,
    the variable is substituted with the result of the respective query.

    Example::

        htsql_environment:
            user_site:
                user[$USER].site.code
            user_site_studies:
                /user[$USER].site.site_x_study.study.code
    """

    name = 'htsql_environment'

    default = {}
    validate = MapVal(StrVal, MaybeVal(StrVal))

    def merge(self, old_value, new_value):
        value = {}
        value.update(self.validate(old_value))
        value.update(self.validate(new_value))
        return value


class AccessQueriesSetting(Setting):
    """
    Parameter `access_queries` maps permission names to HTSQL queries.

    Each query is executed to check whether the current user has the
    corresponding permission.  The user name is passed as the `$USER`
    variable.

    Example::

        access_queries:
          system_admin: user[$USER].system_admin
          lab_admin: user[$USER].exists(lab_x_user.lab_admin)
          recruiter: user[$USER].exists(study_x_user.recruit_participants)
    """

    name = 'access_queries'
    default = {}
    validate = MapVal(StrVal, MaybeVal(StrVal))

    def merge(self, old_value, new_value):
        value = {}
        value.update(self.validate(old_value))
        value.update(self.validate(new_value))
        return value


class AccessMasksSetting(Setting):
    """
    Parameter `access_masks` maps permission names to a collection
    of masks.  The masks are applied when the user accesses any
    resource that requires the respective permission.

    Example::

        access_masks:
          lab_admin: lab?exists(lab_x_user.user.remote_user=$USER)
          recruiter:
          - study?exists(study_x_user.(recruit_participants&user.remote_user=$USER))
          - measure_type?status='active'
    """

    name = 'access_masks'
    default = {}
    validate = MapVal(StrVal, MaybeVal(OneOrSeqVal(StrVal)))

    def merge(self, old_value, new_value):
        value = {}
        value.update(self.validate(old_value))
        value.update(self.validate(new_value))
        return value


class AuthenticateByQuery(Authenticate):

    @classmethod
    def enabled(cls):
        settings = get_settings()
        return (settings.user_query is not None or
                settings.auto_user_query is not None)

    def __call__(self, req):
        if req.remote_user is None:
            return None
        return authenticate_by_query(req.remote_user)


class AuthorizeByQuery(Authorize):

    access = None

    @classmethod
    def all(cls, package=None):
        if cls.access is not None:
            return []
        if 'rex.db' not in get_packages():
            return []
        settings = get_settings()
        implementations = []
        for access in sorted(settings.access_queries):
            AuthClass = type(
                    'Authorize'+access.title().replace('_', ''),
                    (AuthorizeByQuery,),
                    {'access': access})
            implementations.append(AuthClass)
        return implementations

    def __call__(self, req):
        user = authenticate(req)
        if user is None:
            return False
        return authorize_by_query(user, self.access)


class ConfineMasks(Confine):

    priority = 'masks'

    @classmethod
    def enabled(cls):
        settings = get_settings()
        return any(settings.access_masks.values())

    def __call__(self, req):
        settings = get_settings()
        masks = settings.access_masks.get(self.access)
        if masks:
            db = get_db()
            if isinstance(masks, list):
                return db.mask(*masks)
            else:
                return db.mask(masks)
        else:
            return None


@cached(expires=10)
def authenticate_by_query(user):
    settings = get_settings()
    user_query = settings.user_query
    auto_user_query = settings.auto_user_query
    db = get_db()
    with db.isolate(), db.transaction():
        if user_query:
            product = db.produce(user_query, USER=user)
            if product.data:
                return user
        if auto_user_query:
            product = db.produce(auto_user_query, USER=user)
            if product.data:
                return product.data
    return None


@cached(expires=10)
def authorize_by_query(user, access):
    settings = get_settings()
    query = settings.access_queries[access]
    db = get_db()
    product = db.produce(query, USER=user)
    return bool(product.data)


