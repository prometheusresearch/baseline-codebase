from webob.exc import HTTPUnauthorized
from rex.core import cached, Error
from rex.web import (
    HandleLocation,
    Command,
    authorize,
    render_to_response,
    find_assets_bundle,
)
from rex.graphql import (
    schema,
    Entity,
    connect,
    query,
    q,
    sort,
    scalar,
    entity_id,
    argument,
    filter_from_function,
)
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
                "contact_info": query(
                    q.contact_info,
                    type=contact_info,
                    description="Contact information for the user",
                ),
                "phone": query(
                    q.contact_info.filter(q.type == "phone").first(),
                    type=contact_info,
                    description="User phone contact information",
                ),
                "patients": query(q.patient, type=patient),
            },
        )

        patient = Entity(
            "patient",
            fields=lambda: {
                "name": query(q.name),
                "date_of_birth": query(q.date_of_birth),
                "caregiver": query(q.caregiver, type=user),
            },
        )

        contact_info = Entity(
            "contact_info",
            fields=lambda: {
                "user": query(q.user, type=user),
                "type": query(q.type),
                "value": query(q.value),
            },
        )

        @filter_from_function()
        def search_user(search: scalar.String = None):
            if search is not None:
                yield q.remote_user.matches(search)

        @filter_from_function()
        def search_patient(search: scalar.String = None):
            if search is not None:
                yield q.name.matches(search)

        filter_user_by_system_admin = q.system_admin == argument(
            "system_admin", type=scalar.Boolean
        )

        filter_patient_by_caregiver = q.caregiver == argument(
            "caregiver", type=entity_id.user
        )

        sort_user = sort(user, ("remote_user", "expires"))

        return schema(
            fields=lambda: {
                "user": connect(
                    query=q.user,
                    type=user,
                    sort=sort_user,
                    filters=[filter_user_by_system_admin, search_user],
                    description="Users",
                ),
                "patient": connect(
                    query=q.patient,
                    type=patient,
                    filters=[filter_patient_by_caregiver, search_patient],
                    description="Patients",
                ),
            }
        )

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
