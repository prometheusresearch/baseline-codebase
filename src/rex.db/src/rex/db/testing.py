#
# Copyright (c) 2020, Prometheus Research, LLC
#


from rex.core.testing import RexTestSuite

from .database import get_db


class IsolatedRexTestSuite(RexTestSuite):
    """
    A ``pytest``-compatible test suite class that will automatically activate
    a Rex application and database transaction for the duration of the tests
    defined as part of the class. The transaction will be automatically
    rolled back at the completion of all tests in the class.
    """

    #: The HTSQL connection to the primary application database.
    htsql = None

    #: The ``psycopg`` connection to the primary application database.
    connection = None

    transaction = None

    @classmethod
    def setup_class(cls):
        super().setup_class()
        cls.htsql = get_db()
        cls.htsql.__enter__()
        cls.transaction = cls.htsql.transaction()
        cls.connection = cls.transaction.__enter__().connection

    @classmethod
    def teardown_class(cls):
        cls.connection.rollback()
        cls.connection = None
        cls.transaction.__exit__(None, None, None)
        cls.transaction = None
        cls.htsql.__exit__(None, None, None)
        cls.htsql = None
        super().teardown_class()


class IsolatedCasesRexTestSuite(RexTestSuite):
    """
    A ``pytest``-compatible test suite class that will automatically activate
    a Rex application for the duration of the tests defined as part of the
    class. A new database transaction will be automatically started prior to
    each test and automatically rolled back after the test.
    """

    #: The HTSQL connection to the primary application database.
    htsql = None

    #: The ``psycopg`` connection to the primary application database.
    connection = None

    transaction = None

    @classmethod
    def setup_class(cls):
        super().setup_class()
        cls.htsql = get_db()
        cls.htsql.__enter__()

    @classmethod
    def teardown_class(cls):
        cls.htsql.__exit__(None, None, None)
        cls.htsql = None
        super().teardown_class()

    def setup_method(self):
        self.transaction = self.htsql.transaction()
        self.connection = self.transaction.__enter__().connection

    def teardown_method(self):
        self.connection.rollback()
        self.connection = None
        self.transaction.__exit__(None, None, None)
        self.transaction = None

