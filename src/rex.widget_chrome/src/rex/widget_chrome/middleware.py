
from rex.core import get_settings, get_packages
from rex.web import authenticate, Pipe, url_for
from rex.db import get_db, Query
from webob import Response
from urllib import quote

from .setting import UsernameQuery


class SignupRedirect(Pipe):
    priority = 'signup_redirect'
    after = ['error', 'transaction', 'i18n']
    before = ['routing']

    def __call__(self, req):
        user = authenticate(req)
        root_package = get_packages()[0]
        root_url = url_for(req, '%s:/' % root_package.name)
        profile_url = get_settings().user_profile_url
        if profile_url:
            profile_url = url_for(req, profile_url)
            profile_url += ('?' if '?' not in profile_url else '&') \
                           + 'return_to=' + quote(root_url)
            query = get_settings().username_query
            with get_db():
                username = Query(query).produce().data
            if root_url == req.url \
            and query != UsernameQuery.default \
            and username == user:
                return Response(status=302, location=profile_url)
        return self.handle(req)

    @classmethod
    def signature(cls):
        return cls.priority
