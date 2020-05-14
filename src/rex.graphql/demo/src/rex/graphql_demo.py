import os
import tempfile
import collections
import urllib.request, urllib.parse, urllib.error
import csv

from rex.ctl import RexTaskWithProject as RexTask, option, log
from rex.db import get_db
from rex.web import HandleLocation
from rex.core import cached
from rex.graphql import (
    mutation_from_function,
    compute_from_function,
    compute,
    scalar,
    Object,
    InputObject,
    InputObjectField,
    GraphQLError
)
from rex.graphql.serve import serve
from rex.graphql.reflect import reflect

BASE_URL = "https://raw.githubusercontent.com/rbt-lang/rbt-proto/47f0b7148ad2f9c90626d0269e2fc67a52d2c7f0/data/tpch"
BASE_DIR = os.path.join(
    tempfile.gettempdir(), "rex.graphql_demo.%s" % os.geteuid()
)


class API(HandleLocation):

    path = "/"
    access = "anybody"

    @cached
    def schema(self):
        reflection = reflect()

        # Add mutation

        class State:
            counter = 0

        @reflection.add_mutation()
        @mutation_from_function()
        def increment(v: scalar.Int) -> scalar.Int:
            State.counter += v
            return State.counter

        @reflection.add_field()
        @compute_from_function()
        def counter() -> scalar.Int:
            return State.counter

        # Add basic computation with input object

        PointOut = Object(
            name="Point",
            description="Point",
            fields=lambda: {
                "x": compute(scalar.Int),
                "y": compute(scalar.Int),
            },
        )

        PointIn = InputObject(
            name="PointIn",
            description="Point",
            fields=lambda: {
                "x": InputObjectField(scalar.Int),
                "y": InputObjectField(scalar.Int),
            },
            parse=lambda data: Point(x=data.get("x"), y=data.get("y")),
        )

        Point = collections.namedtuple("Point", ["x", "y"])

        @reflection.add_field()
        @compute_from_function(description="Move point")
        def move(
            point: PointIn, x: scalar.Int = None, y: scalar.Int = None
        ) -> PointOut:
            print(point, x, y)
            if x is not None:
                point = Point(x=x, y=point.y)
            if y is not None:
                point = Point(x=point.x, y=y)
            return point

        @reflection.add_mutation()
        @mutation_from_function()
        def make_region_and_fail() -> scalar.String:
            db = get_db()
            db.produce("/insert(region := {name := 'FAIL'})")
            raise GraphQLError("error creating region")

        return reflection.to_schema()

    def __call__(self, req):
        return serve(self.schema(), req)


class PopulateTask(RexTask):
    """populate the demo database"""

    name = "graphql-demo-populate"

    class options:
        quiet = option("q", hint="suppress output")

    def __call__(self):
        self.do("deploy")
        with self.make(ensure="rex.graphql_demo"):
            db = get_db()
            with db, db.transaction():
                connection = db.connect()
                cursor = connection.cursor()
                self.populate(cursor)
                connection.commit()

    def lines(self, filename):
        if not self.quiet:
            log("Loading `{}`...", filename)
        if not os.path.exists(BASE_DIR):
            os.makedirs(BASE_DIR)
        path = os.path.join(BASE_DIR, filename)
        if not os.path.exists(path):
            url = os.path.join(BASE_URL, filename)
            urllib.request.urlretrieve(url, path)
        return csv.reader(open(path))

    def populate(self, cursor):
        regions = {}
        for key, name, comment in self.lines("region.csv"):
            cursor.execute(
                """
                INSERT INTO region (name, comment)
                VALUES (%s, %s)
                RETURNING id""",
                (name, comment),
            )
            regions[key] = cursor.fetchone()[0]
        nations = {}
        for key, name, regionkey, comment in self.lines("nation.csv"):
            cursor.execute(
                """
                INSERT INTO nation (name, region_id, comment)
                VALUES (%s, %s, %s)
                RETURNING id""",
                (name, regions[regionkey], comment),
            )
            nations[key] = cursor.fetchone()[0]
        customers = {}
        for (
            key,
            name,
            address,
            nationkey,
            phone,
            acctbal,
            mktsegment,
            comment,
        ) in self.lines("customer.csv"):
            cursor.execute(
                """
                INSERT INTO customer (name, address, nation_id, phone, acctbal, mktsegment, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id""",
                (
                    name,
                    address,
                    nations[nationkey],
                    phone,
                    acctbal,
                    mktsegment,
                    comment,
                ),
            )
            customers[key] = cursor.fetchone()[0]
        suppliers = {}
        for (
            key,
            name,
            address,
            nationkey,
            phone,
            acctbal,
            comment,
        ) in self.lines("supplier.csv"):
            cursor.execute(
                """
                INSERT INTO supplier (name, address, nation_id, phone, acctbal, comment)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id""",
                (name, address, nations[nationkey], phone, acctbal, comment),
            )
            suppliers[key] = cursor.fetchone()[0]
        parts = {}
        for (
            key,
            name,
            mfgr,
            brand,
            type_,
            size,
            container,
            retailprice,
            comment,
        ) in self.lines("part.csv"):
            cursor.execute(
                """
                INSERT INTO part (name, mfgr, brand, type, size, container, retailprice, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id""",
                (
                    name,
                    mfgr,
                    brand,
                    type_,
                    size,
                    container,
                    retailprice,
                    comment,
                ),
            )
            parts[key] = cursor.fetchone()[0]
        partsupps = {}
        for partkey, suppkey, availqty, supplycost, comment in self.lines(
            "partsupp.csv"
        ):
            cursor.execute(
                """
                INSERT INTO partsupp (part_id, supplier_id, availqty, supplycost, comment)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id""",
                (
                    parts[partkey],
                    suppliers[suppkey],
                    availqty,
                    supplycost,
                    comment,
                ),
            )
            partsupps[partkey, suppkey] = cursor.fetchone()[0]
        orders = {}
        for (
            key,
            custkey,
            orderstatus,
            totalprice,
            orderdate,
            orderpriority,
            clerk,
            shippriority,
            comment,
        ) in self.lines("orders.csv"):
            cursor.execute(
                """
                INSERT INTO "order" (
                    key, customer_id, orderstatus, totalprice, orderdate,
                    orderpriority, clerk, shippriority, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id""",
                (
                    key,
                    customers[custkey],
                    orderstatus,
                    totalprice,
                    orderdate,
                    orderpriority,
                    clerk,
                    shippriority,
                    comment,
                ),
            )
            orders[key] = cursor.fetchone()[0]
        lineitems = {}
        for (
            orderkey,
            partkey,
            suppkey,
            linenumber,
            quantity,
            extendedprice,
            discount,
            tax,
            returnflag,
            linestatus,
            shipdate,
            commitdate,
            receiptdate,
            shipinstruct,
            shipmode,
            comment,
        ) in self.lines("lineitem.csv"):
            cursor.execute(
                """
                INSERT INTO lineitem (
                    order_id, partsupp_id, linenumber, quantity, extendedprice,
                    discount, tax, returnflag, linestatus, shipdate, commitdate,
                    receiptdate, shipinstruct, shipmode, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id""",
                (
                    orders[orderkey],
                    partsupps[partkey, suppkey],
                    linenumber,
                    quantity,
                    extendedprice,
                    discount,
                    tax,
                    returnflag,
                    linestatus,
                    shipdate,
                    commitdate,
                    receiptdate,
                    shipinstruct,
                    shipmode,
                    comment,
                ),
            )
            lineitems[orderkey, linenumber] = cursor.fetchone()[0]
