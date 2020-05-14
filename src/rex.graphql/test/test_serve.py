import pytest
import json

from webob import Request
from webob.exc import HTTPBadRequest, HTTPMethodNotAllowed
from rex.db import get_db
from rex.core import Rex
from rex.graphql import (
    schema,
    query,
    argument,
    q,
    Entity,
    scalar,
)
from rex.graphql.serve import serve


@pytest.fixture(scope="module")
def rex():
    # Create Rex instance for all tests.
    db = "pgsql:graphql_demo"
    rex = Rex("rex.graphql_demo", db=db)
    return rex


@pytest.fixture(scope="module")
def sch(rex):
    with rex:
        region = Entity(name="region", fields=lambda: {"name": query(q.name)})
        sch = schema(
            fields=lambda: {
                "all": query(q.region, type=region),
                "byname": query(
                    q.region.filter(argument("name", scalar.String)).first(),
                    type=region,
                ),
            }
        )
        return sch


@pytest.fixture(autouse=True)
def with_rex(rex):
    # Wrap each test case with `with rex: ...`
    with rex:
        yield


query_all = "query { all { name } }"
expected_all = {
    "data": {
        "all": [
            {"name": "AFRICA"},
            {"name": "AMERICA"},
            {"name": "ASIA"},
            {"name": "EUROPE"},
            {"name": "MIDDLE EAST"},
        ]
    }
}

vars_byname = {"name": "AFRICA"}
query_byname = "query($name: String!) { byname(name: $name) { name } }"
expected_byname = {"data": {"byname": {"name": "AFRICA"}}}


def test_serve_empty_query(sch):
    req = Request.blank("/", method="POST", accept="application/json")
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert res.json is None


def test_serve_query_via_post_multipart_form_data(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="multipart/form-data",
        POST={"query": query_all},
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert "errors" not in res.json
    assert res.json == expected_all


def test_serve_query_via_post_multipart_form_data_vars(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="multipart/form-data",
        POST={"query": query_byname, "variables": json.dumps(vars_byname)},
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert "errors" not in res.json
    assert res.json == expected_byname


def test_serve_query_via_post_application_json(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="application/json",
        body=json.dumps({"query": query_all}).encode("utf8"),
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert "errors" not in res.json
    assert res.json == expected_all


def test_serve_query_via_post_application_json_vars(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="application/json",
        body=json.dumps(
            {"query": query_byname, "variables": vars_byname}
        ).encode("utf8"),
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert "errors" not in res.json
    assert res.json == expected_byname


def test_serve_query_via_post_application_graphql(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="application/graphql",
        body=query_all.encode("utf8"),
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert "errors" not in res.json
    assert res.json == expected_all


def test_serve_query_via_get(sch):
    req = Request.blank(
        "/",
        method="GET",
        accept="application/json",
        query_string=f"query={query_all}",
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert "errors" not in res.json
    assert res.json == expected_all


def test_serve_query_via_get_vars(sch):
    req = Request.blank(
        "/",
        method="GET",
        accept="application/json",
        query_string=f"query={query_byname}&variables={json.dumps(vars_byname)}",
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "application/json"
    assert "errors" not in res.json
    assert res.json == expected_byname


def test_serve_graphiql(sch):
    req = Request.blank(
        "/",
        method="GET",
        accept="text/html",
        query_string=f"query={query_all}",
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "text/html"
    assert b"graphiql.js" in res.body


def test_serve_graphiql_ignores_malformed_vars(sch):
    req = Request.blank(
        "/",
        method="GET",
        accept="text/html",
        query_string=f"query={query_all}&variables=sss",
    )
    res = serve(sch, req)
    assert res.status_code == 200
    assert res.content_type == "text/html"
    assert b"graphiql.js" in res.body


def test_serve_err_invalid_method(sch):
    req = Request.blank(
        "/",
        method="HEAD",
        accept="application/json",
        content_type="application/json",
        body=json.dumps({"query": query_byname, "variables": {}}).encode(
            "utf8"
        ),
    )
    with pytest.raises(HTTPMethodNotAllowed):
        serve(sch, req)


def test_serve_err_invalid_json_body(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="application/json",
        body=b"SSS",
    )
    with pytest.raises(HTTPBadRequest):
        serve(sch, req)


def test_serve_get_invalid_vars_json(sch):
    req = Request.blank(
        "/",
        method="GET",
        accept="application/json",
        query_string=f"query={query_all}&variables=sss",
    )
    with pytest.raises(HTTPBadRequest):
        serve(sch, req)


def test_serve_err_vars_json(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="multipart/form-data",
        POST={"query": query_byname, "variables": "ss"},
    )
    with pytest.raises(HTTPBadRequest):
        serve(sch, req)


def test_serve_exec_err_missing_vars(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="application/json",
        body=json.dumps({"query": query_byname, "variables": {}}).encode(
            "utf8"
        ),
    )
    with pytest.raises(HTTPBadRequest) as res:
        serve(sch, req)
        assert res.content_type == "application/json"
        assert "data" not in res.json
        assert res.json["errors"]


def test_serve_exec_err_invalid_syntax(sch):
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="application/json",
        body=json.dumps({"query": "query{"}).encode("utf8"),
    )
    with pytest.raises(HTTPBadRequest) as res:
        serve(sch, req)
        assert res.content_type == "application/json"
        assert "data" not in res.json
        assert res.json["errors"]


def test_error_aborts_db_tx(rex, sch):
    query = """
    mutation { make_region_and_fail }
    """
    req = Request.blank(
        "/",
        method="POST",
        accept="application/json",
        content_type="application/json",
        body=json.dumps({"query": query}).encode("utf8"),
    )
    res = req.get_response(rex)
    assert res.status_code == 400

    db = get_db()
    pr = db.produce("top(region?name='FAIL')")
    assert pr.data is None
