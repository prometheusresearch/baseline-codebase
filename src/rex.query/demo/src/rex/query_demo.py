
from rex.ctl import RexTask, option, log
from rex.db import get_db
import os
import tempfile
import urllib
import csv

BASE_URL = 'https://raw.githubusercontent.com/rbt-lang/rbt-proto/47f0b7148ad2f9c90626d0269e2fc67a52d2c7f0/data/tpch'
BASE_DIR = os.path.join(tempfile.gettempdir(), 'rex.query_demo.%s' % os.geteuid())


class PopulateTask(RexTask):
    """populate the demo database"""

    name = 'query-demo-populate'

    class options:
        quiet = option(hint="suppress output")

    def __call__(self):
        self.do('deploy')
        with self.make(ensure='rex.query_demo'):
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
            urllib.urlretrieve(url, path)
        return csv.reader(open(path))

    def populate(self, cursor):
        regions = {}
        for key, name, comment in self.lines('region.csv'):
            cursor.execute("""
                INSERT INTO region (name, comment)
                VALUES (%s, %s)
                RETURNING id""", (
                name,
                comment))
            regions[key] = cursor.fetchone()[0]
        nations = {}
        for key, name, regionkey, comment in self.lines('nation.csv'):
            cursor.execute("""
                INSERT INTO nation (name, region_id, comment)
                VALUES (%s, %s, %s)
                RETURNING id""", (
                name,
                regions[regionkey],
                comment))
            nations[key] = cursor.fetchone()[0]
        customers = {}
        for key, name, address, nationkey, phone, acctbal, mktsegment, comment in self.lines('customer.csv'):
            cursor.execute("""
                INSERT INTO customer (name, address, nation_id, phone, acctbal, mktsegment, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id""", (
                name,
                address,
                nations[nationkey],
                phone,
                acctbal,
                mktsegment,
                comment))
            customers[key] = cursor.fetchone()[0]
        suppliers = {}
        for key, name, address, nationkey, phone, acctbal, comment in self.lines('supplier.csv'):
            cursor.execute("""
                INSERT INTO supplier (name, address, nation_id, phone, acctbal, comment)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id""", (
                name,
                address,
                nations[nationkey],
                phone,
                acctbal,
                comment))
            suppliers[key] = cursor.fetchone()[0]
        parts = {}
        for key, name, mfgr, brand, type_, size, container, retailprice, comment in self.lines('part.csv'):
            cursor.execute("""
                INSERT INTO part (name, mfgr, brand, type, size, container, retailprice, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id""", (
                name,
                mfgr,
                brand,
                type_,
                size,
                container,
                retailprice,
                comment))
            parts[key] = cursor.fetchone()[0]
        partsupps = {}
        for partkey, suppkey, availqty, supplycost, comment in self.lines('partsupp.csv'):
            cursor.execute("""
                INSERT INTO partsupp (part_id, supplier_id, availqty, supplycost, comment)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id""", (
                parts[partkey],
                suppliers[suppkey],
                availqty,
                supplycost,
                comment))
            partsupps[partkey, suppkey] = cursor.fetchone()[0]
        orders = {}
        for key, custkey, orderstatus, totalprice, orderdate, \
                orderpriority, clerk, shippriority, comment in self.lines('orders.csv'):
            cursor.execute("""
                INSERT INTO "order" (
                    key, customer_id, orderstatus, totalprice, orderdate,
                    orderpriority, clerk, shippriority, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id""", (
                key,
                customers[custkey],
                orderstatus,
                totalprice,
                orderdate,
                orderpriority,
                clerk,
                shippriority,
                comment))
            orders[key] = cursor.fetchone()[0]
        lineitems = {}
        for orderkey, partkey, suppkey, linenumber, quantity, extendedprice, \
                discount, tax, returnflag, linestatus, shipdate, commitdate, \
                receiptdate, shipinstruct, shipmode, comment in self.lines('lineitem.csv'):
            cursor.execute("""
                INSERT INTO lineitem (
                    order_id, partsupp_id, linenumber, quantity, extendedprice,
                    discount, tax, returnflag, linestatus, shipdate, commitdate,
                    receiptdate, shipinstruct, shipmode, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id""", (
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
                comment))
            lineitems[orderkey, linenumber] = cursor.fetchone()[0]

