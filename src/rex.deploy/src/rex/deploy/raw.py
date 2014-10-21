#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import Error, StrVal
from .fact import Fact
import re
import os.path


class RawFact(Fact):
    """
    Wraps a raw SQL statement.

    `action_sql`: ``unicode``
        SQL statement to execute a DDL operation.
    `action_sql_path`: ``unicode``
        Path to a file with a DDL SQL statement.
    `check_sql`: ``unicode``
        SQL statement to verify if the DDL operation is already applied.
    `check_sql_path`: ``unicode``
        Path to a file with a check SQL statement.
    """

    fields = [
            ('sql', StrVal),
            ('unless', StrVal),
    ]

    @classmethod
    def build(cls, driver, spec):
        action_sql = None
        action_sql_path = None
        if re.match(r'\A\S+\Z', spec.sql):
            action_sql_path = spec.sql
            if driver.cwd is not None:
                action_sql_path = os.path.join(driver.cwd, action_sql_path)
        else:
            action_sql = spec.sql
        check_sql = None
        check_sql_path = None
        if re.match(r'\A\S+\Z', spec.unless):
            check_sql_path = spec.unless
            if driver.cwd is not None:
                check_sql_path = os.path.join(driver.cwd, check_sql_path)
        else:
            check_sql = spec.unless
        return cls(action_sql=action_sql, action_sql_path=action_sql_path,
                   check_sql=check_sql, check_sql_path=check_sql_path)

    def __init__(self, action_sql=None, action_sql_path=None,
                 check_sql=None, check_sql_path=None):
        assert action_sql is None or isinstance(action_sql, str)
        assert action_sql_path is None or isinstance(action_sql_path, str)
        assert check_sql is None or isinstance(check_sql, str)
        assert check_sql_path is None or isinstance(check_sql_path, str)
        assert (action_sql is None) != (action_sql_path is None)
        assert (check_sql is None) != (check_sql_path is None)
        self.action_sql = action_sql
        self.action_sql_path = action_sql_path
        self.check_sql = check_sql
        self.check_sql_path = check_sql_path

    def __repr__(self):
        args = []
        if self.action_sql is not None:
            args.append("action_sql=%r" % self.action_sql)
        if self.action_sql_path is not None:
            args.append("action_sql_path=%r" % self.action_sql_path)
        if self.check_sql is not None:
            args.append("check_sql=%r" % self.check_sql)
        if self.check_sql_path is not None:
            args.append("check_sql_path=%r" % self.check_sql_path)
        return "%s(%s)" % (self.__class__.__name__, ", ".join(args))

    def __call__(self, driver):
        # Prepare SQL.
        action_sql = self._load(self.action_sql, self.action_sql_path)
        check_sql = self._load(self.check_sql, self.check_sql_path)
        # Check the postcondition and execute DDL.
        was_locked = driver.set_lock(False)
        postcondition = driver.submit(check_sql)
        driver.set_lock(was_locked)
        if all(not item for row in postcondition or []
                        for item in row):
            if driver.is_locked:
                raise Error("Discovered failed assertion:",
                            self.check_sql or self.check_sql_path)
            driver.submit(action_sql)

    def _load(self, sql, sql_path):
        if sql is not None:
            return sql
        with open(sql_path) as stream:
            return stream.read()


