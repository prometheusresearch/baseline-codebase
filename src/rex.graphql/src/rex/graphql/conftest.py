import pytest


@pytest.fixture(autouse=True)
def conf_doctest(doctest_namespace):
    from rex import graphql
    from rex.core import Rex
    from rex.db import get_db

    db = "pgsql:graphql_demo"
    rex = Rex("rex.graphql_demo", db=db)

    class Settings:
        title = "AppTitle"

    def get_settings(parent, info, args):
        return Settings

    for name in graphql.__all__:
        doctest_namespace[name] = getattr(graphql, name)

    doctest_namespace["region"] = graphql.Entity(
        name="region", fields=lambda: {"name": graphql.query(graphql.q.name)}
    )
    doctest_namespace["settings"] = graphql.Object(
        name="settings",
        fields=lambda: {"title": graphql.compute(graphql.scalar.String)},
    )
    doctest_namespace["get_settings"] = get_settings

    with rex:
        db = get_db()
        with db, db.transaction() as tx:
            try:
                yield
            finally:
                tx.rollback()
