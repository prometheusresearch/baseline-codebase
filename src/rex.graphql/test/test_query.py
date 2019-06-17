import pytest
from rex.graphql.query import query as q, execute, to_htsql_syntax
from rex.core import Rex


@pytest.fixture(scope="module")
def rex():
    # Create Rex instance for all tests.
    db = "pgsql:graphql_demo"
    rex = Rex("rex.graphql_demo", db=db)
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


def test_id():
    query = q.nation.id
    assert str(to_htsql_syntax(query)) == "/nation.id()"
    execute(query)


def test_matches():
    query = q.nation.name.matches("something")
    assert str(to_htsql_syntax(query)) == "/nation.name~'something'"
    execute(query)

def test_sort():
    query = q.region.sort(q.name)
    assert str(to_htsql_syntax(query)) == "/region.sort(name)"
    execute(query)

    query = q.region.sort(q.name.desc())
    assert str(to_htsql_syntax(query)) == "/region.sort(name-)"
    execute(query)

    query = q.region.sort(q.name.desc(), q.comment)
    assert str(to_htsql_syntax(query)) == "/region.sort(name-,comment)"
    execute(query)
