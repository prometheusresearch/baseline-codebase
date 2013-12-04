#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (LatentRex, Extension, Validate, StrVal, OneOrSeqVal,
        RecordVal, SwitchVal, Error, guard, locate, set_location)
from .introspect import introspect
import sys
import psycopg2


class FactVal(Validate):

    def _switch(self):
        validate_map = {}
        with LatentRex('rex.deploy'):
            fact_types = Fact.all()
        for fact_type in fact_types:
            validate_map[fact_type.key] = fact_type.validate
        return SwitchVal(validate_map)

    def __call__(self, data):
        switch_val = self._switch()
        return switch_val(data)

    def construct(self, loader, node):
        switch_val = self._switch()
        return switch_val.construct(loader, node)


class UnicodeVal(StrVal):

    def __init__(self, pattern=None):
        super(UnicodeVal, self).__init__(pattern)

    def __call__(self, data):
        data = super(UnicodeVal, self).__call__(data)
        return data.decode('utf-8')

    def construct(self, loader, node):
        data = super(UnicodeVal, self).construct(loader, node)
        return data.decode('utf-8')


class LabelVal(UnicodeVal):

    def __init__(self):
        super(LabelVal, self).__init__(r'[a-z_][0-9a-z_]*')


class DottedLabelVal(UnicodeVal):

    def __init__(self):
        super(DottedLabelVal, self).__init__(
                r'[a-z_][0-9a-z_]*([.][a-z_][0-9a-z_]*)?')


LOG_ALL = (1 << 0)
LOG_PROGRESS = (1 << 1)
LOG_TIMING = (1 << 2)
LOG_SQL = (1 << 3)

class Driver(object):

    validate = OneOrSeqVal(FactVal())

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
        with LatentRex('rex.deploy'):
            fact_types = Fact.all()
        for fact_type in fact_types:
            if isinstance(spec, fact_type.validate.record_type):
                fact = fact_type.build(self, spec)
                set_location(fact, spec)
                return fact
        assert False, "unknown fact record: %s" % spec

    def log(self, level, msg, *args, **kwds):
        if not self.logging:
            return
        if isinstance(self.logging, int):
            if not (self.logging&LOG_ALL or self.logging&level):
                return
            stream = sys.stdout
        else:
            stream = self.logging
        if hasattr(stream, 'write'):
            if args or kwds:
                msg = msg.format(*args, **kwds)
            stream.write(msg+"\n")
            stream.flush()
        else:
            stream(level, msg, *args, **kwds)

    def get_catalog(self):
        if self.catalog is None:
            self.catalog = introspect(self.connection)
        return self.catalog

    def get_schema(self):
        return self.get_catalog()[u"public"]

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

    def submit(self, sql):
        cursor = self.connection.cursor()
        try:
            self.log(LOG_SQL, "{}", sql)
            cursor.execute(sql)
            if cursor.description is not None:
                return cursor.fetchall()
        except psycopg2.Error, exc:
            error = Error("Got an error from the database driver:", exc)
            error.wrap("While executing SQL:", sql)
            raise error
        finally:
            cursor.close()


class Fact(Extension):
    """Represents a state of the database."""

    fields = []
    key = None
    validate = None

    @classmethod
    def sanitize(cls):
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


