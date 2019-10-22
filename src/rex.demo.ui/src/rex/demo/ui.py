from webob.exc import HTTPUnauthorized
from rex.core import cached, Error
from rex.web import (
    HandleLocation,
    Command,
    authorize,
    render_to_response,
    find_assets_bundle,
)
from rex.graphql import schema, Entity, connect, query, q, scalar, argument
from rex.graphql.serve import serve


class API(HandleLocation):

    path = "/_api/graphql"
    access = "authenticated"

    @cached
    def schema(self):
        user = Entity(
            "user",
            fields=lambda: {
                "remote_user": query(q.remote_user),
                "expires": query(q.expires),
                "system_admin": query(q.system_admin),
            },
        )
        return schema(fields=lambda: {
            "user": connect(query=q.user, type=user, filters=[
                q.system_admin == argument('system_admin', type=scalar.Boolean)
            ])
        })

    def __call__(self, req):
        if not authorize(req, self):
            raise HTTPUnauthorized()
        return serve(self.schema(), req)


class Index(Command):
    access = "authenticated"
    path = "/"

    def render(self, req):
        bundle = find_assets_bundle()
        if bundle is None:
            raise Error("No assets bundle found")
        return render_to_response(
            "rex.demo.ui:/templates/index.html", req, bundle=bundle
        )
