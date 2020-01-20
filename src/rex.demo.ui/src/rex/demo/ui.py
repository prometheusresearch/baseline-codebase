from datetime import datetime
from webob.exc import HTTPUnauthorized
from rex.core import cached, Error
from rex.db import get_db
from rex.web import (
    HandleLocation,
    Command,
    authorize,
    render_to_response,
)
from rex.graphql import (
    schema,
    Object,
    Entity,
    List,
    connect,
    query,
    q,
    sort,
    scalar,
    compute,
    entity_id,
    argument,
    Enum,
    EnumValue,
    compute_from_function,
    filter_from_function,
    mutation_from_function,
)
from rex.graphql.serve import serve

@cached
def get_schema():

    search_result = Object(
        name="search_result",
        fields=lambda: {
            "id": compute(scalar.String),
            "type": compute(scalar.String),
            "label": compute(scalar.String),
        }
    )

    @compute_from_function()
    def search(search: scalar.String) -> List(search_result):
        results = []

        q_users = q.user.filter(q.remote_user.matches(search)).select(
            id=q.id,
            type='user',
            label=q.remote_user
        )
        q_sites = q.site.filter(q.title.matches(search)).select(
            id=q.id,
            type='site',
            label=q.title
        )
        q_patients = q.patient.filter(q.name.matches(search)).select(
            id=q.id,
            type='patient',
            label=q.name
        )

        for q_results in [q_users, q_patients, q_sites]:
            results = results + q_results.take(10).produce().data

        return results

    q_user_expired = q.expires.boolean() & (q.expires <= datetime.now())
    q_user_phone = q.contact_info.filter(q.type == "phone").first()

    user = Entity(
        "user",
        fields=lambda: {
            "remote_user": query(q.remote_user),
            "expires": query(q.expires),
            "expired": query(q_user_expired),
            "system_admin": query(q.system_admin),
            "contact_info": query(
                q.contact_info,
                type=contact_info,
                description="Contact information for the user",
            ),
            "phone": query(
                q_user_phone,
                type=contact_info,
                description="User phone contact information",
            ),
            "patients": query(q.patient, type=patient),
            "sites": query(q.user_x_site, type=user_x_site),
        },
    )

    site = Entity(
        "site",
        fields=lambda: {
            "title": query(q.title),
            "code": query(q.code),
            "users": query(q.user_x_site, type=user_x_site),
        },
    )

    user_x_site = Entity(
        "user_x_site",
        fields=lambda: {
            "site": query(q.site, type=site),
            "user": query(q.user, type=user),
            "role": query(q.role, type=user_x_site_role),
        },
    )

    user_x_site_role = Enum(
        name="user_x_site_role", values=[EnumValue("admin"), EnumValue("user")]
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

    @filter_from_function()
    def filter_user_by_expired(expired: scalar.Boolean = None):
        if expired is not None:
            if expired:
                yield q_user_expired
            else:
                yield ~q_user_expired

    @filter_from_function()
    def filter_user_by_has_phone(has_phone: scalar.Boolean = None):
        if has_phone is not None:
            if has_phone:
                yield q_user_phone.boolean()
            else:
                yield ~q_user_phone.boolean()

    sort_user = sort(user, remote_user=q.remote_user, expires=q.expires)

    @mutation_from_function()
    def remove_user(user_ids: List(entity_id.user)) -> scalar.Boolean:
        db = get_db()
        db.produce(
            """
            /user.filter(id()=$user_ids){id()}/:delete
            """,
            user_ids=user_ids,
        )
        return True

    @mutation_from_function()
    def add_user_to_site(
        user_ids: List(entity_id.user),
        site_id: entity_id.site,
        role: user_x_site_role = "user",
    ) -> scalar.Boolean:
        db = get_db()
        for user_id in user_ids:
            db.produce(
                """
                /insert(user_x_site := {
                    user := $user_id,
                    site := $site_id,
                    role := $role
                })
                """,
                user_id=user_id,
                site_id=site_id,
                role=role,
            )
        return True

    return schema(
        fields=lambda: {
            "user": connect(
                query=q.user,
                type=user,
                sort=sort_user,
                filters=[
                    filter_user_by_system_admin,
                    filter_user_by_expired,
                    filter_user_by_has_phone,
                    search_user,
                ],
                description="Users",
            ),
            "patient": connect(
                query=q.patient,
                type=patient,
                filters=[filter_patient_by_caregiver, search_patient],
                description="Patients",
            ),
            "site": connect(query=q.site, type=site, description="Sites"),
            "search": search,
        },
        mutations=[remove_user, add_user_to_site],
    )


class API(HandleLocation):

    path = "/_api/graphql"
    access = "authenticated"

    def __call__(self, req):
        if not authorize(req, self):
            raise HTTPUnauthorized()
        return serve(get_schema(), req)


class Index(Command):
    access = "authenticated"
    path = "/**"

    def render(self, req):
        return render_to_response("rex.demo.ui:/templates/index.html", req)
