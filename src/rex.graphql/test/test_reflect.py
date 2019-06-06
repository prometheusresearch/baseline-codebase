import pytest
import json

from rex.core import Rex
from rex.graphql import reflect, execute, query, q, scalar
from rex.graphql.reflect import reflect


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
            region(id: "AMERICA") {
                name
            }
        }
        """,
    )
    assert norm(res.data) == {"region": {"name": "AMERICA"}}
    res = execute(
        schema,
        """
        query {
            region__all {
                name
            }
        }
        """,
    )
    assert norm(res.data) == {
        "region__all": [
            {"name": "AFRICA"},
            {"name": "AMERICA"},
            {"name": "ASIA"},
            {"name": "EUROPE"},
            {"name": "MIDDLE EAST"},
        ]
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
            order__all(orderdate__eq: ["1998-08-02"]) {
                id
                orderdate
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order__all": [
            {"id": "4678", "orderdate": "1998-08-02"},
            {"id": "7969", "orderdate": "1998-08-02"},
            {"id": "12324", "orderdate": "1998-08-02"},
            {"id": "12384", "orderdate": "1998-08-02"},
            {"id": "20195", "orderdate": "1998-08-02"},
            {"id": "45955", "orderdate": "1998-08-02"},
        ]
    }
    res = execute(
        schema,
        """
        query {
            order__all(orderdate__eq: ["1998-08-02", "1998-08-01"]) {
                id
                orderdate
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order__all": [
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
    # gt
    res = execute(
        schema,
        """
        query {
            order__all(orderdate__gt: "1998-08-01") {
                id
                orderdate
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order__all": [
            {"id": "4678", "orderdate": "1998-08-02"},
            {"id": "7969", "orderdate": "1998-08-02"},
            {"id": "12324", "orderdate": "1998-08-02"},
            {"id": "12384", "orderdate": "1998-08-02"},
            {"id": "20195", "orderdate": "1998-08-02"},
            {"id": "45955", "orderdate": "1998-08-02"},
        ]
    }
    # ge
    res = execute(
        schema,
        """
        query {
            order__all(orderdate__ge: "1998-08-01") {
                id
                orderdate
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order__all": [
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
    # lt
    res = execute(
        schema,
        """
        query {
            order__all(orderdate__lt: "1992-01-02") {
                id
                orderdate
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order__all": [
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
    # le
    res = execute(
        schema,
        """
        query {
            order__all(orderdate__le: "1992-01-02") {
                id
                orderdate
            }
        }
        """,
    )
    assert not res.errors
    assert norm(res.data) == {
        "order__all": [
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


def test_reflect_paginated():
    schema = reflect(include_tables={"order"}).to_schema()
    res = execute(
        schema,
        """
        query {
            items: order__paginated {
                id
            }
        }
        """,
    )
    assert not res.errors
    assert len(res.data["items"]) == 20
    res = execute(
        schema,
        """
        query {
            items: order__paginated(limit: 10) {
                id
            }
        }
        """,
    )
    assert not res.errors
    assert len(res.data["items"]) == 10
    res2 = execute(
        schema,
        """
        query {
            items: order__paginated(limit: 10, offset: 2) {
                id
            }
        }
        """,
    )
    assert not res2.errors
    assert len(res2.data["items"]) == 10
    assert res2.data["items"][:-2] == res.data["items"][2:]


def test_reflect_add_field():
    reflection = reflect(include_tables={"region"})

    # Now we can modify reflected types by injectint new fields.
    reflection.add_field("region_count", query(q.region.count()))

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


def test_reflect_add_entity_field():
    reflection = reflect(include_tables={"region"})
    assert "region" in reflection.types

    # Now we can modify reflected types by injectint new fields.
    reflection.types["region"].add_field(
        "name_name", query(q.name + "_" + q.name)
    )

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            region(id: "AFRICA") {
                name_name
            }
        }
        """,
    )
    assert not res.errors
    assert res.data == {"region": {"name_name": "AFRICA_AFRICA"}}


def test_reflect_add_filter():
    reflection = reflect(include_tables={"region"})
    all_regions = reflection.fields["region__all"]

    # We can add a new filter for the query.
    @all_regions.add_filter
    def filter_by_name(name: scalar.String):
        yield q.name == name

    # Finally we call produce working schema and do queries.
    schema = reflection.to_schema()
    res = execute(
        schema,
        """
        query {
            region__all(name: "AFRICA") {name}
        }
        """,
    )
    assert not res.errors
    assert res.data == {"region__all": [{"name": "AFRICA"}]}
