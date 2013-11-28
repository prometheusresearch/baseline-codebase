#
# Copyright (c) 2013, Prometheus Research, LLC
#


from rex.core import (Extension, Validate, StrVal, OneOrSeqVal, RecordVal,
        SwitchVal, get_packages, Error, guard, locate, set_location)
from .cluster import get_cluster
from .introspect import introspect
import datetime
import psycopg2
import yaml


class FactVal(Validate):

    def _switch(self):
        validate_map = {}
        for fact_type in Fact.all():
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


class Driver(object):

    validate = OneOrSeqVal(FactVal())

    def __init__(self, connection, logging={}):
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

    def log(self, msg, *args, **kwds):
        log = self.logging.get('log')
        if log is not None:
            log(msg, *args, **kwds)

    def warn(self, msg, *args, **kwds):
        warn = self.logging.get('warn')
        if warn is not None:
            warn(msg, *args, **kwds)

    def debug(self, msg, *args, **kwds):
        debug = self.logging.get('debug')
        if debug is not None:
            debug(msg, *args, **kwds)

    def get_catalog(self):
        if self.catalog is None:
            self.catalog = introspect(self.connection)
        return self.catalog

    def get_schema(self):
        return self.get_catalog()[u"public"]

    def __call__(self, facts, is_locked=None):
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
            self.debug(sql)
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

    def __str__(self):
        return unicode(self).encode('utf-8')

    def __unicode__(self):
        return yaml.dump(self, Dumper=FactDumper)

    def __repr__(self):
        raise NotImplementedError("%s.__repr__()" % self.__class__.__name__)

    def __yaml__(self):
        raise NotImplementedError("%s.__yaml__()" % self.__class__.__name__)


class FactDumper(yaml.Dumper):

    def represent_str(self, data):
        # Represent both `str` and `unicode` objects as YAML strings.
        # Use block style for multiline strings.
        if isinstance(data, unicode):
            data = data.encode('utf-8')
        tag = None
        style = None
        if data.endswith('\n'):
            style = '|'
        try:
            data = data.decode('utf-8')
            tag = u'tag:yaml.org,2002:str'
        except UnicodeDecodeError:
            data = data.encode('base64')
            tag = u'tag:yaml.org,2002:binary'
            style = '|'
        return self.represent_scalar(tag, data, style=style)

    def represent_fact(self, data):
        # Represent `Fact` objects.
        tag = u'tag:yaml.org,2002:map'
        mapping = list(data.__yaml__())
        flow_style = None
        return self.represent_mapping(tag, mapping, flow_style=flow_style)

FactDumper.add_representer(str, FactDumper.represent_str)
FactDumper.add_representer(unicode, FactDumper.represent_str)
FactDumper.add_multi_representer(Fact, FactDumper.represent_fact)


def deploy(logging={}, dry_run=False):
    time_start = datetime.datetime.now()
    # Prepare the driver.
    cluster = get_cluster()
    connection = cluster.connect()
    driver = Driver(connection, logging=logging)
    packages = [package for package in reversed(get_packages())
                        if package.exists('deploy.yaml')]
    if not packages:
        driver.log("Nothing to deploy.")
    facts_by_package = {}
    # Load and parse `deploy.yaml` files.
    for package in packages:
        driver.chdir(package.abspath('/'))
        package_facts = driver.parse(package.open('deploy.yaml'))
        if not isinstance(package_facts, list):
            package_facts = [package_facts]
        facts_by_package[package] = package_facts
    driver.chdir(None)
    # Deploying database schema.
    for package in packages:
        driver.log("Deploying {}.", package.name)
        facts = facts_by_package[package]
        driver(facts)
    # Validating directives.
    driver.reset()
    for package in packages:
        driver.log("Validating {}.", package.name)
        facts = facts_by_package[package]
        driver(facts, is_locked=True)
    # Commit changes and report.
    if not dry_run:
        connection.commit()
    else:
        driver.log("Rolling back changes (dry run).")
        connection.rollback()
    time_end = datetime.datetime.now()
    driver.debug("Total time: {}", time_end-time_start)


