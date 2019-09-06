import pytest
from rex.query.builder import Q, q, to_htsql_syntax
from rex.core import Rex
from rex.db import get_db


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
    query.produce()


def test_filter():
    query = q.region.filter(True)
    assert str(to_htsql_syntax(query)) == "/region.filter(true)"
    query.produce()


def test_select():
    query = q.region.select(region_name=q.name)
    assert str(to_htsql_syntax(query)) == "/region{name}"
    query.produce()


def test_group():
    query = q.nation.group(region=q.region.name)
    assert str(to_htsql_syntax(query)) == "/(nation^{region:=region.name})"
    query.produce()


def test_eq_many():
    query = q.region.filter(q.name == ["AFRICA", "AMERICA"])
    assert (
        str(to_htsql_syntax(query))
        == "/region.filter(name={'AFRICA','AMERICA'})"
    )


def test_function():
    query = q.count(q.nation)
    assert str(to_htsql_syntax(query)) == "count(nation)"
    query.produce()


def test_function_postfix():
    query = q.nation.count()
    assert str(to_htsql_syntax(query)) == "count(nation)"
    query.produce()


def test_id():
    query = q.nation.id
    assert str(to_htsql_syntax(query)) == "/nation.id()"
    query.produce()


def test_matches():
    query = q.nation.name.matches("something")
    assert str(to_htsql_syntax(query)) == "/nation.name~'something'"
    query.produce()


def test_sort():
    query = q.region.sort(q.name)
    assert str(to_htsql_syntax(query)) == "/region.sort(name)"
    query.produce()

    query = q.region.sort(q.name.desc())
    assert str(to_htsql_syntax(query)) == "/region.sort(name-)"
    query.produce()

    query = q.region.sort(q.name.desc(), q.comment)
    assert str(to_htsql_syntax(query)) == "/region.sort(name-,comment)"
    query.produce()


def test_with_db():
    """ We can use ``Q(db)`` to associate query with db at creation time."""
    db = get_db()
    query_demo = Q(db)
    query = query_demo.region.count()
    assert str(to_htsql_syntax(query)) == "count(region)"
    assert query.produce().data == 5


def test_to_data():
    """ We can use ``.to_data()`` method to produce data."""
    assert q.region.count().to_data() == 5


def test_to_df():
    """ We can use ``.to_df()`` method to a dataframe."""
    assert q.region.count().to_df()[0][0] == 5
    assert q.region.to_df().name[0] == "AFRICA"
    assert q.region.name.to_df()[0][0] == "AFRICA"


def test_to_copy_stream():
    stream = q.region.to_copy_stream()
    stream.seek(0)
    assert stream.read() == "\n".join(
        [
            "1\tAFRICA\tlar deposits. blithely final packages cajole. regular waters are final requests. regular accounts are according to ",
            "2\tAMERICA\ths use ironic, even requests. s",
            "3\tASIA\tges. thinly even pinto beans ca",
            "4\tEUROPE\tly final courts cajole furiously final excuse",
            "5\tMIDDLE EAST\tuickly special accounts cajole carefully blithely close requests. carefully final asymptotes haggle furiousl",
            ""
        ]
    )
