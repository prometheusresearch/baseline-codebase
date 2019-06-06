import pytest
from rex.graphql.query import query as q, execute, to_htsql_syntax
from rex.core import Rex


@pytest.fixture(scope="module")
def rex():
    # Create Rex instance for all tests.
    db = "pgsql:query_demo"
    rex = Rex("rex.query_demo", db=db)
    return rex


@pytest.fixture(autouse=True)
def with_rex(rex):
    # Wrap each test case with `with rex: ...`
    with rex:
        yield


def test_navigate():
    query = q.region
    assert str(to_htsql_syntax(query)) == "/region"
    execute(query)


def test_filter():
    query = q.region.filter(True)
    assert str(to_htsql_syntax(query)) == "/region.filter(true)"
    execute(query)


def test_select():
    query = q.region.select(region_name=q.name)
    assert str(to_htsql_syntax(query)) == "/region{name}"
    execute(query)


def test_group():
    query = q.nation.group(region=q.region.name)
    assert str(to_htsql_syntax(query)) == "/(nation^{region:=region.name})"
    execute(query)


def test_eq_many():
    query = q.region.filter(q.name == ["AFRICA", "AMERICA"])
    assert (
        str(to_htsql_syntax(query))
        == "/region.filter(name={'AFRICA','AMERICA'})"
    )


def test_function():
    query = q.count(q.nation)
    assert str(to_htsql_syntax(query)) == "count(nation)"
    execute(query)


def test_function_postfix():
    query = q.nation.count()
    assert str(to_htsql_syntax(query)) == "count(nation)"
    execute(query)
