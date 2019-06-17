import pytest
import json

from rex.core import Rex
from rex.graphql import (
    reflect,
    execute,
    query,
    q,
    scalar,
    filter_from_function,
    compute_from_function,
    mutation_from_function,
)
from rex.graphql.reflect import reflect


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


def norm(data):
    return json.loads(json.dumps(data))


def test_reflect_simple():
    schema = reflect().to_schema()
    assert "region" in schema.types
    assert "nation" in schema.types
    assert "region" in schema["nation"].fields
    assert "nation" in schema["region"].fields
    res = execute(
        schema,
        """
        query {
            region {
                america: get(id: "AMERICA") {
                    name
                }
            }
        }
        """,
    )
    assert norm(res.data) == {"region": {"america": {"name": "AMERICA"}}}
    res = execute(
        schema,
        """
        query {
            region {
                all {
                    name
                }
            }
        }
        """,
    )
    assert norm(res.data) == {
        "region": {
            "all": [
                {"name": "AFRICA"},
                {"name": "AMERICA"},
                {"name": "ASIA"},
                {"name": "EUROPE"},
                {"name": "MIDDLE EAST"},
            ]
        }
    }


def test_reflect_restrict_via_include():
    schema = reflect(include_tables={"region"}).to_schema()
    assert "region" in schema.types
    assert "nation" not in schema.types
    assert "nation" not in schema["region"].fields


def test_reflect_restrict_via_exclude():
    schema = reflect(exclude_tables={"nation"}).to_schema()
    assert "region" in schema.types
    assert "nation" not in schema.types
    assert "nation" not in schema["region"].fields


def test_reflect_filter_date():
    schema = reflect(include_tables={"order"}).to_schema()
    assert "order" in schema.types
    assert "orderdate" in schema["order"].fields
    # eq
    res = execute(
        schema,
        """
        query {
            order {
                all(orderdate__eq: ["1998-08-02"]) {
                    id
                    orderdate
                }
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order": {
            "all": [
                {"id": "4678", "orderdate": "1998-08-02"},
                {"id": "7969", "orderdate": "1998-08-02"},
                {"id": "12324", "orderdate": "1998-08-02"},
                {"id": "12384", "orderdate": "1998-08-02"},
                {"id": "20195", "orderdate": "1998-08-02"},
                {"id": "45955", "orderdate": "1998-08-02"},
            ]
        }
    }
    res = execute(
        schema,
        """
        query {
            order {
                all(orderdate__eq: ["1998-08-02", "1998-08-01"]) {
                    id
                    orderdate
                }
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order": {
            "all": [
                {"id": "4678", "orderdate": "1998-08-02"},
                {"id": "7969", "orderdate": "1998-08-02"},
                {"id": "12324", "orderdate": "1998-08-02"},
                {"id": "12384", "orderdate": "1998-08-02"},
                {"id": "20195", "orderdate": "1998-08-02"},
                {"id": "22403", "orderdate": "1998-08-01"},
                {"id": "27588", "orderdate": "1998-08-01"},
                {"id": "37735", "orderdate": "1998-08-01"},
                {"id": "45955", "orderdate": "1998-08-02"},
            ]
        }
    }
    # gt
    res = execute(
        schema,
        """
        query {
            order {
                all(orderdate__gt: "1998-08-01") {
                    id
                    orderdate
                }
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order": {
            "all": [
                {"id": "4678", "orderdate": "1998-08-02"},
                {"id": "7969", "orderdate": "1998-08-02"},
                {"id": "12324", "orderdate": "1998-08-02"},
                {"id": "12384", "orderdate": "1998-08-02"},
                {"id": "20195", "orderdate": "1998-08-02"},
                {"id": "45955", "orderdate": "1998-08-02"},
            ]
        }
    }
    # ge
    res = execute(
        schema,
        """
        query {
            order {
                all(orderdate__ge: "1998-08-01") {
                    id
                    orderdate
                }
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order": {
            "all": [
                {"id": "4678", "orderdate": "1998-08-02"},
                {"id": "7969", "orderdate": "1998-08-02"},
                {"id": "12324", "orderdate": "1998-08-02"},
                {"id": "12384", "orderdate": "1998-08-02"},
                {"id": "20195", "orderdate": "1998-08-02"},
                {"id": "22403", "orderdate": "1998-08-01"},
                {"id": "27588", "orderdate": "1998-08-01"},
                {"id": "37735", "orderdate": "1998-08-01"},
                {"id": "45955", "orderdate": "1998-08-02"},
            ]
        }
    }
    # lt
    res = execute(
        schema,
        """
        query {
            order {
                all(orderdate__lt: "1992-01-02") {
                    id
                    orderdate
                }
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order": {
            "all": [
                {"id": "3271", "orderdate": "1992-01-01"},
                {"id": "5607", "orderdate": "1992-01-01"},
                {"id": "20742", "orderdate": "1992-01-01"},
                {"id": "23010", "orderdate": "1992-01-01"},
                {"id": "27015", "orderdate": "1992-01-01"},
                {"id": "27137", "orderdate": "1992-01-01"},
                {"id": "37543", "orderdate": "1992-01-01"},
                {"id": "45697", "orderdate": "1992-01-01"},
            ]
        }
    }
    # le
    res = execute(
        schema,
        """
        query {
            order {
                all(orderdate__le: "1992-01-02") {
                    id
                    orderdate
                }
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order": {
            "all": [
                {"id": "1248", "orderdate": "1992-01-02"},
                {"id": "3139", "orderdate": "1992-01-02"},
                {"id": "3271", "orderdate": "1992-01-01"},
                {"id": "3712", "orderdate": "1992-01-02"},
                {"id": "5607", "orderdate": "1992-01-01"},
                {"id": "20742", "orderdate": "1992-01-01"},
                {"id": "23010", "orderdate": "1992-01-01"},
                {"id": "27015", "orderdate": "1992-01-01"},
                {"id": "27137", "orderdate": "1992-01-01"},
                {"id": "37543", "orderdate": "1992-01-01"},
                {"id": "45697", "orderdate": "1992-01-01"},
            ]
        }
    }


def test_reflect_by_page():
    schema = reflect(include_tables={"order"}).to_schema()
    res = execute(
        schema,
        """
        query {
            order {
                items: paginated {
                    id
                }
            }
        }
        """,
    )
    assert not res.errors
    assert len(res.data["order"]["items"]) == 20
    res = execute(
        schema,
        """
        query {
            order {
                items: paginated(limit: 10) {
                    id
                }
            }
        }
        """,
    )
    assert not res.errors
    assert len(res.data["order"]["items"]) == 10
    res2 = execute(
        schema,
        """
        query {
            order {
                items: paginated(limit: 10, offset: 2) {
                    id
                }
            }
        }
        """,
    )
    assert not res2.errors
    assert len(res2.data["order"]["items"]) == 10
    assert res2.data["order"]["items"][:-2] == res.data["order"]["items"][2:]


def test_reflect_related_direct():
    reflection = reflect(include_tables={"region", "nation"})
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            nation {
                egypt: get(id: "EGYPT") {
                    region {
                        name
                    }
                }
            }
        }
        """,
    )
    assert not res.errors
    assert res.data == {
        "nation": {"egypt": {"region": {"name": "MIDDLE EAST"}}}
    }


def test_reflect_related_reverse():
    reflection = reflect(include_tables={"region", "nation"})
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            region {
                asia: get(id: "ASIA") {
                    nation {
                        all {
                            name
                        }
                    }
                }
            }
        }
        """,
    )
    assert not res.errors
    assert res.data == {
        "region": {
            "asia": {
                "nation": {
                    "all": [
                        {"name": "CHINA"},
                        {"name": "INDIA"},
                        {"name": "INDONESIA"},
                        {"name": "JAPAN"},
                        {"name": "VIETNAM"},
                    ]
                }
            }
        }
    }


def test_reflect_add_query_field():
    reflection = reflect(include_tables={"region"})

    # Now we can modify reflected types by injecting new fields.
    reflection.add_field(name="region_count", field=query(q.region.count()))

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            region_count
        }
        """,
    )
    assert not res.errors
    assert res.data == {"region_count": 5}


def test_reflect_add_compute_field():
    reflection = reflect(include_tables={"region"})

    @reflection.add_field()
    @compute_from_function()
    def some_number() -> scalar.Int:
        return 42

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()

    res = execute(
        schema,
        """
        query {
            some_number
        }
        """,
    )
    assert not res.errors
    assert res.data == {"some_number": 42}


def test_reflect_add_mutation():
    reflection = reflect(include_tables={"region"})

    class Counter:
        value = 0

    @reflection.add_field()
    @compute_from_function()
    def counter() -> scalar.Int:
        return Counter.value

    @reflection.add_mutation()
    @mutation_from_function()
    def increment(v: scalar.Int) -> scalar.Int:
        Counter.value += v
        return Counter.value

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()

    res = execute(schema, "query { counter }")
    assert not res.errors
    assert res.data == {"counter": 0}

    res = execute(schema, "mutation { counter: increment(v: 100) }")
    assert not res.errors
    assert res.data == {"counter": 100}

    res = execute(schema, "query { counter }")
    assert not res.errors
    assert res.data == {"counter": 100}


def test_reflect_add_entity_field():
    reflection = reflect(include_tables={"region"})
    assert "region" in reflection.types

    # Now we can modify reflected types by injecting new fields.
    reflection.types["region"].add_field(
        "name_name", query(q.name + "_" + q.name)
    )

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            region {
                africa: get(id: "AFRICA") {
                    name_name
                }
            }
        }
        """,
    )
    assert not res.errors
    assert res.data == {"region": {"africa": {"name_name": "AFRICA_AFRICA"}}}


def test_reflect_add_filter():
    reflection = reflect(include_tables={"region"})
    all_regions = reflection.types["region_connection"].fields["all"]

    # We can add a new filter for the query.
    @all_regions.add_filter()
    @filter_from_function()
    def filter_by_name(name: scalar.String):
        yield q.name == name

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            region {
                all(name: "AFRICA") {
                    name
                }
            }
        }
        """,
    )
    assert not res.errors
    assert res.data == {"region": {"all": [{"name": "AFRICA"}]}}


def test_reflect_set_sort():
    reflection = reflect(include_tables={"region"})
    all_regions = reflection.types["region_connection"].fields["all"]
    all_regions.set_sort(q.name.desc())

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            region {
                all {
                    name
                }
            }
        }
        """,
    )
    assert not res.errors
    assert res.data == {
        "region": {
            "all": [
                {"name": "MIDDLE EAST"},
                {"name": "EUROPE"},
                {"name": "ASIA"},
                {"name": "AMERICA"},
                {"name": "AFRICA"},
            ]
        }
    }
