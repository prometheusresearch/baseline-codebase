import pytest
from rex.query.builder import q, produce, to_htsql_syntax
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
    produce(query)


def test_filter():
    query = q.region.filter(True)
    assert str(to_htsql_syntax(query)) == "/region.filter(true)"
    produce(query)


def test_select():
    query = q.region.select(region_name=q.name)
    assert str(to_htsql_syntax(query)) == "/region{name}"
    produce(query)


def test_group():
    query = q.nation.group(region=q.region.name)
    assert str(to_htsql_syntax(query)) == "/(nation^{region:=region.name})"
    produce(query)


def test_eq_many():
    query = q.region.filter(q.name == ["AFRICA", "AMERICA"])
    assert (
        str(to_htsql_syntax(query))
        == "/region.filter(name={'AFRICA','AMERICA'})"
    )


def test_function():
    query = q.count(q.nation)
    assert str(to_htsql_syntax(query)) == "count(nation)"
    produce(query)


def test_function_postfix():
    query = q.nation.count()
    assert str(to_htsql_syntax(query)) == "count(nation)"
    produce(query)


def test_id():
    query = q.nation.id
    assert str(to_htsql_syntax(query)) == "/nation.id()"
    produce(query)


def test_matches():
    query = q.nation.name.matches("something")
    assert str(to_htsql_syntax(query)) == "/nation.name~'something'"
    produce(query)


def test_sort():
    query = q.region.sort(q.name)
    assert str(to_htsql_syntax(query)) == "/region.sort(name)"
    produce(query)

    query = q.region.sort(q.name.desc())
    assert str(to_htsql_syntax(query)) == "/region.sort(name-)"
    produce(query)

    query = q.region.sort(q.name.desc(), q.comment)
    assert str(to_htsql_syntax(query)) == "/region.sort(name-,comment)"
    produce(query)
