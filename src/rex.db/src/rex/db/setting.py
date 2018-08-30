#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import (
        Setting, Error, Validate, BoolVal, UIntVal, StrVal, MaybeVal, MapVal,
        UnionVal, OnScalar, OnField)
from htsql.core.util import DB


class DBVal(Validate):
    """
    Accepts and parses HTSQL connection URI.
    """

    def __call__(self, data):
        try:
            return DB.parse(data)
        except ValueError as exc:
            raise Error(str(exc))


class HTSQLVal(Validate):
    # Generates HTSQL configuration.

    validate = UnionVal(
            (OnScalar, DBVal),
            (OnField('database'), DBVal),
            MapVal(StrVal, MaybeVal(MapVal(StrVal))))

    def __call__(self, data):
        return self._normalize(self.validate(data))

    def construct(self, loader, node):
        return self._normalize(self.validate.construct(loader, node))

    @classmethod
    def merge(cls, *values):
        # Merge configuration parameters.
        merged = {}
        for value in values:
            value = cls._normalize(value)
            merged = cls._merge_pair(merged, value)
        return merged

    @classmethod
    def _normalize(cls, data):
        # Unifies configuration value.
        if data is None:
            data = {}
        if isinstance(data, str):
            try:
                data = DB.parse(data)
            except ValueError:
                pass
        if isinstance(data, DB):
            data = {'htsql': {'db': data}}
        if isinstance(data, dict):
            data = dict((key, value if value is not None else {})
                        for key, value in list(data.items()))
        return data

    @classmethod
    def _merge_pair(cls, old, new):
        # Merges nested lists and dictionaries.
        if isinstance(old, list) and isinstance(new, list):
            return old+new
        elif isinstance(old, dict) and isinstance(new, dict):
            merged = old.copy()
            for key, value in sorted(new.items()):
                merged[key] = cls._merge_pair(merged.get(key), value)
            return merged
        else:
            return new


class DBSetting(Setting):
    """
    Database configuration.

    The must be either database connection URI or full HTSQL configuration.

    Database connection URI must have the form::

        <engine>://<username>:<password>@<host>:<port>/<database>

    `<engine>`
        Type of the database server, e.g., ``sqlite``, ``pgsql``, ``mysql``.
    `<username>:<password>`
        Authentication parameters.
    `<host>:<port>`
        The address of the database server.
    `<database>`
        The name of the database; for SQLite, the path to the database file.

    All parameters except ``<engine>`` and ``<database>`` are optional.

    The connection parameters could be also provided as a record with fields
    ``engine``, ``username``, ``password``, ``host``, ``port``, ``database``.

    HTSQL configuration is a dictionary that maps addon names to addon
    configuration.  Addon configuration is a dictionary that maps addon
    parameters to parameter values.

    Examples::

        db: sqlite:///sandbox/htsql_demo.sqlite

        db: pgsql://htsql_demo:demo@localhost/htsql_demo

        db:
            engine: mysql
            database: htsql_demo

        db:
            htsql:
              db: pgsql:rexdb_demo
            tweak.meta:
            tweak.shell.default:
            tweak.timeout:
                timeout: 600
            tweak.autolimit:
                limit: 10000

    This setting could be specified more than once.  Configuration
    parameters preset by different packages are merged into one.
    """

    name = 'db'
    validate = HTSQLVal()
    merge = HTSQLVal.merge


class GatewaysSetting(Setting):
    """
    Database configuration for secondary databases.

    Use this setting to specify additional application databases.

    The setting value is a dictionary that maps a name to connection
    URI or full HTSQL configuration.

    Examples::

        gateways:

            input:
                tweak.filedb:
                    sources:
                    - file: ./csv/family.csv
                    - file: ./csv/individua.csv
                    - file: ./csv/measure.csv

            target: mssql://10.0.0.2/target

    This setting could be specified more than once.  Configuration
    parameters preset by different packages are merged into one.
    """

    name = 'gateways'
    validate = MapVal(StrVal(r'[A-Za-z_][0-9A-Za-z_]*'),
                      MaybeVal(HTSQLVal()))
    default = {}

    @classmethod
    def merge(cls, old_value, new_value):
        # Merges configuration preset in different packages.
        if not (isinstance(old_value, dict) and isinstance(new_value, dict)):
            return new_value
        value = dict((key, old_value[key])
                     for key in old_value if old_value[key])
        for key in sorted(new_value):
            if new_value[key] is None:
                value.pop(key, None)
            else:
                value[key] = HTSQLVal.merge(value.get(key), new_value[key])
        return value


class HTSQLExtensionsSetting(Setting):
    """
    Configuration of HTSQL extensions for the primary database.

    Use this setting to preset HTSQL configuration for a particular
    application or to override the preset HTSQL configuration.

    The value of this setting is a dictionary that maps addon names
    to addon configuration.  Addon configuration is a dictionary mapping
    addon parameters to parameter values.

    Example::

        htsql_extensions:
            tweak.meta:
            tweak.shell.default:
            tweak.timeout:
                timeout: 600
            tweak.autolimit:
                limit: 10000

    This setting could be specified more than once.  Configuration
    parameters preset by different packages are merged into one.
    """

    name = 'htsql_extensions'
    validate = MaybeVal(MapVal(StrVal, MaybeVal(MapVal(StrVal))))
    default = None
    merge = HTSQLVal.merge


class QueryTimeoutSetting(Setting):
    """
    Limit on the query execution time (in seconds).

    This parameter sets the upper limit on the query execution time.
    The query is aborted if the execution time exceeds the limit.

    Example::

        query_timeout: 120

    By default, this parameter is unset.  The timeout is only enforced
    on PostgreSQL databases.
    """

    name = 'query_timeout'
    validate = MaybeVal(UIntVal())
    default = None


class ReadOnlySetting(Setting):
    """
    Sets the application database in read-only mode.

    This parameter prevents the application from modifying the database
    when it handles incoming HTTP requests.

    Example::

        read_only: true
    """

    name = 'read_only'
    validate = BoolVal()
    default = False


