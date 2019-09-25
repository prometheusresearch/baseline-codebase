import pytest
from rex.query import Q, q
from rex.query.builder import to_htsql_syntax, Param
from rex.core import Rex, Error
from rex.db import RexHTSQL, HTSQLVal, get_db


@pytest.fixture(scope="module")
def rex():
    # Create Rex instance for all tests.
    db = "pgsql:query_demo"
    rex = Rex("rex.query_demo", db=db)
    return rex


@pytest.fixture(scope="module")
def db(rex):
    # Wrap each test case with `with rex: ...`
    with rex:
        return get_db()


@pytest.fixture(autouse=True)
def with_rex(rex):
    # Wrap each test case with `with rex: ...`
    with rex:
        yield


def test_navigate_getattr():
    query = q.region
    assert str(to_htsql_syntax(query)) == "/region"
    query.produce()


def test_navigate_getitem():
    query = q['region']
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


def test_keep():
    query = (
        q.nation.filter(q.id.text() == "JAPAN")
        .keep(this_nation=q.here())
        .region.nation.filter(q.id == q.this_nation.id)
        .name
    )
    assert query.to_data() == ["JAPAN"]


def test_variables():
    class Arg(Param):
        def __init__(self, name):
            self.name = name

        def __eq__(self, o):
            return self.name == o.name

        def with_type(self, _type):
            return self

    name = Arg("name")
    query = q.region.filter(q.name == name).first().name
    assert "name" in query.params
    assert query.to_data(variables={"name": "ASIA"}) == "ASIA"
    assert query.to_data(variables={"name": "AFRICA"}) == "AFRICA"
    with pytest.raises(Error):
        assert query.to_data()


def test_user():
    query = q.user.filter(q.name == "Jason").first().name
    assert query.to_data() == "Jason"


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


def test_to_copy_stream(db):
    stream = q.region.to_copy_stream()

    # Look at the data
    stream.seek(0)
    assert stream.read() == "\n".join(
        [
            "1\tAFRICA\tlar deposits. blithely final packages cajole. regular waters are final requests. regular accounts are according to ",
            "2\tAMERICA\ths use ironic, even requests. s",
            "3\tASIA\tges. thinly even pinto beans ca",
            "4\tEUROPE\tly final courts cajole furiously final excuse",
            "5\tMIDDLE EAST\tuickly special accounts cajole carefully blithely close requests. carefully final asymptotes haggle furiousl",
            "",
        ]
    )

    # Try actually copy data back to db
    with db, db.transaction() as tx:
        try:
            cur = tx.connection.cursor()
            cur.execute(
                "CREATE TABLE region_copy AS TABLE region WITH NO DATA;"
            )
            stream.seek(0)
            cur.copy_expert(f"COPY region_copy FROM STDIN", stream)
            cur.execute("select * from region_copy")
            assert len(cur.fetchall()) == 5
        finally:
            tx.rollback()
