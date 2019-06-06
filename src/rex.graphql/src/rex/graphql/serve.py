"""

    rex.graphql.serve
    =================

    Serve GraphQL :class:`webob.Request` with the specified schema.

    Based on code from ``graphql`` package.

    :copyright: 2016 GraphQL Python
    :copyright: 2019-present Prometheus Research, LLC

"""

from typing import Any
import json

from webob import Response, Request
from webob.exc import HTTPBadRequest, HTTPMethodNotAllowed

from . import model
from .schema import Schema
from .serve_graphiql import serve_graphiql
from .execute import execute

__all__ = ("serve",)


def serve(
    schema: Schema, req: Request, db: Any = None, graphiql_enabled: bool = True
) -> Response:
    """ Serve HTTP request with GraphQL query according to schema."""

    method = req.method.lower()

    show_graphiql = (
        graphiql_enabled and method == "get" and "text/html" in req.accept
    )

    if method not in ("get", "post"):
        raise HTTPMethodNotAllowed(
            "GraphQL only supports GET and POST requests.",
            headers={"Allow": "GET, POST"},
        )

    params = Params.from_req(req, ignore_malformed_variables=show_graphiql)

    result = None
    if params.query is not None:
        result = execute(
            query=params.query,
            schema=schema,
            variables=params.variables,
            db=db,
        )

    if show_graphiql:
        return serve_graphiql(params=params, result=result)
    else:
        status = 200
        if result is not None:
            if result.invalid:
                status = 400
            result = result.to_dict()
        return Response(
            json=result, status=status, content_type="application/json"
        )


class Params:
    __slots__ = ("query", "variables", "operation_name")

    def __init__(self, query, variables, operation_name):
        self.query = query
        self.variables = variables
        self.operation_name = operation_name

    @classmethod
    def from_req(cls, req, ignore_malformed_variables=False):
        if req.method.lower() == "post":
            content_type = req.content_type
            if content_type == "application/graphql":
                data = {"query": req.body.decode("utf8")}

            elif content_type == "application/json":
                try:
                    data = json.loads(req.body.decode("utf8"))
                except Exception:
                    raise HTTPBadRequest("POST body sent invalid JSON.")

            elif content_type in (
                "application/x-www-form-urlencoded",
                "multipart/form-data",
            ):
                data = req.params
            else:
                data = {}

            query = data.get("query")
            operation_name = data.get("operationName")
            variables = data.get("variables")
            if variables and isinstance(variables, str):
                try:
                    variables = json.loads(variables)
                except Exception:
                    raise HTTPBadRequest("Variables are invalid JSON.")

            return cls(
                query=query, variables=variables, operation_name=operation_name
            )
        elif req.method.lower() == "get":
            query = req.GET.get("query")
            variables = req.GET.get("variables")
            if variables:
                try:
                    variables = json.loads(variables)
                except Exception:
                    if ignore_malformed_variables:
                        variables = {}
                    else:
                        raise HTTPBadRequest("Variables are invalid JSON.")
            return cls(query=query, operation_name=None, variables=variables)
        else:
            assert False
