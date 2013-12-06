#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (LatentRex, get_rex, Extension, Validate, UStrVal,
        OneOrSeqVal, RecordVal, UnionVal, Error, guard, locate, set_location)
from .introspect import introspect
import sys
import psycopg2


class FactVal(Validate):
    # Converts a mapping to a `Fact` record.

    def construct(self, loader, node):
        union_val = UnionVal([(fact_type.key, fact_type.validate)
                              for fact_type in Fact.all()])
        return union_val.construct(loader, node)


class LabelVal(UStrVal):
    # An entity label.

    pattern = r'[a-z_][0-9a-z_]*'


class QLabelVal(UStrVal):
    # An entity label with an optional qualifier.

    pattern = r'[a-z_][0-9a-z_]*([.][a-z_][0-9a-z_]*)?'


class Driver(object):

    validate = OneOrSeqVal(FactVal())

    LOG_PROGRESS = 'progress'
    LOG_TIMING = 'timing'
    LOG_SQL = 'sql'

    def __init__(self, connection, logging=False):
        self.connection = connection
        self.catalog = None
        self.logging = logging
        self.cwd = None
        self.is_locked = False

    def chdir(self, directory):
        self.cwd = directory

    def lock(self):
        self.is_locked = True

    def unlock(self):
        self.is_locked = False

    def reset(self):
        self.catalog = None
        self.is_locked = False

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()

    def parse(self, stream):
        spec = self.validate.parse(stream)
        if isinstance(spec, list):
            facts = []
            for item in spec:
                with guard("While parsing:", locate(item)):
                    facts.append(self.build(item))
            return facts
        else:
            with guard("While parsing:", locate(spec)):
                return self.build(spec)

    def build(self, spec):
        for fact_type in Fact.all():
            if isinstance(spec, fact_type.validate.record_type):
                fact = fact_type.build(self, spec)
                set_location(fact, spec)
                return fact
        assert False, "unknown fact record: %s" % spec

    def log(self, level, msg, *args, **kwds):
        if not self.logging:
            return
        if self.logging is True:
            if args or kwds:
                msg = msg.format(*args, **kwds)
            print msg
        else:
            self.logging(level, msg, *args, **kwds)

    def log_progress(self, msg, *args, **kwds):
        return self.log(self.LOG_PROGRESS, msg, *args, **kwds)

    def log_timing(self, msg, *args, **kwds):
        return self.log(self.LOG_TIMING, msg, *args, **kwds)

    def log_sql(self, msg, *args, **kwds):
        return self.log(self.LOG_SQL, msg, *args, **kwds)

    def get_catalog(self):
        if self.catalog is None:
            self.catalog = introspect(self.connection)
        return self.catalog

    def get_schema(self):
        return self.get_catalog()[u"public"]

    def submit(self, sql):
        cursor = self.connection.cursor()
        try:
            self.log_sql("{}", sql)
            cursor.execute(sql)
            if cursor.description is not None:
                return cursor.fetchall()
        except psycopg2.Error, exc:
            error = Error("Got an error from the database driver:", exc)
            error.wrap("While executing SQL:", sql)
            raise error
        finally:
            cursor.close()

    def __call__(self, facts, is_locked=None):
        if isinstance(facts, (str, unicode)):
            facts = self.parse(facts)
        if not isinstance(facts, (list, tuple)):
            facts = [facts]
        # Set new lock status.
        if is_locked is not None:
            self.is_locked, is_locked = is_locked, self.is_locked
        try:
            # Apply the facts.
            for fact in facts:
                try:
                    fact(self)
                except Error, error:
                    if not self.is_locked:
                        message = "While deploying:"
                    else:
                        message = "While validating:"
                    location = locate(fact) or fact
                    error.wrap(message, location)
                    raise
        finally:
            # Restore original lock status.
            if is_locked is not None:
                self.is_locked, is_locked = is_locked, self.is_locked

    def __repr__(self):
        return "<%s %s>" % (self.__class__.__name__, self.connection.dsn)


class Fact(Extension):
    """Represents a state of the database."""

    fields = []
    key = None
    validate = None

    @classmethod
    def all(cls):
        # Gets all `Fact` implementations.
        if not get_rex:
            # Allow it to work even when there is no active Rex application.
            with LatentRex('rex.deploy'):
                return super(Fact, cls).all()
        else:
            return super(Fact, cls).all()

    @classmethod
    def sanitize(cls):
        # Prepares the fact validator.
        if cls.__dict__.get('fields'):
            if 'key' not in cls.__dict__:
                cls.key = cls.fields[0][0]
            if 'validate' not in cls.__dict__:
                cls.validate = RecordVal(cls.fields)

    @classmethod
    def enabled(cls):
        return bool(cls.fields)

    def __call__(self, driver):
        raise NotImplementedError("%s.__call__()" % self.__class__.__name__)

    def __repr__(self):
        raise NotImplementedError("%s.__repr__()" % self.__class__.__name__)


