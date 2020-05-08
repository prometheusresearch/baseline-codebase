#
# Copyright (c) 2015, Prometheus Research, LLC
#

import os

from rex.core import cached, get_packages, Error, get_settings, Extension, \
    AnyVal, guard

from .util import record_to_dict
from .validators import DefinitionVal


__all__ = (
    'DefinitionProducer',
    'StaticDefinitionProducer',
    'MART_CONFIGURATION_FILE',
    'get_all_definitions',
    'get_definition',
    'get_hosting_db_uri',
    'get_management_db_uri',
)


class DefinitionProducer(Extension):
    """
    An extension that allows developers to provide Mart Definitions into the
    RexMart framework in whatever manner they need.
    """

    @classmethod
    def get_definitions(cls):
        """
        Produces Mart Definitions that can be used by the rest of the RexMart
        framework.

        The value returned from this method must be a list of dictionaries,
        where each dictionary must take the shape of a Mart Definition.
        """

        return []  # pragma: no cover


#: The name/path to the rex.mart configuration file within a package's static
#: directory.
MART_CONFIGURATION_FILE = 'mart.yaml'


@cached
def get_static_definitions():
    definitions = []
    for package in reversed(get_packages()):
        if package.exists(MART_CONFIGURATION_FILE):
            definitions_path = package.abspath(MART_CONFIGURATION_FILE)
            cfg = AnyVal().parse(open(definitions_path))
            if cfg.get('definitions'):
                for defn in cfg['definitions']:
                    if not defn.get('base_path'):
                        defn['base_path'] = os.path.dirname(definitions_path)
                    definitions.append(defn)
    return definitions


class StaticDefinitionProducer(DefinitionProducer):
    """
    An implementation of DefinitionProducer that extracts Mart Definitions from
    the ``mart.yaml`` files found in the static directory of the RexDB packages
    that make up the current application.
    """

    @classmethod
    def get_definitions(cls):
        return get_static_definitions()


@cached(expires=60)
def get_all_definitions():
    """
    Returns all definitions currently configured in this application instance.

    :rtype: list(dict)
    """

    definitions = []
    validator = DefinitionVal()

    for producer in DefinitionProducer.all():
        with guard('While retrieving definitions from:', producer):
            for defn in producer.get_definitions():
                defn = validator(defn)
                definitions.append(record_to_dict(defn))

    dids = [defn['id'] for defn in definitions]
    dupe_dids = set([did for did in dids if dids.count(did) > 1])
    if dupe_dids:
        raise Error(
            'Definition IDs (%s) cannot be duplicated within a'
            ' collection' % (
                ', '.join(list(dupe_dids)),
            )
        )

    return definitions


def get_definition(identifier):
    """
    Returns the configuration of the specified definition.

    :param identifier: the ID of the definition to retrieve
    :type identifier: str
    :rtype: dict
    """

    for definition in get_all_definitions():
        if definition['id'] == identifier:
            return definition
    return None


@cached
def get_management_db_uri():
    """
    Returns the database connection specifics for connecting to the
    management database.

    :rtype: htsql.core.util.DB
    """

    uri = get_settings().db.get('htsql').get('db')
    return uri


@cached
def get_hosting_db_uri():
    """
    Returns the database connection specifics for connecting to the
    system where the Mart databases are stored.

    :rtype: htsql.core.util.DB
    """

    uri = get_settings().mart_hosting_cluster
    if not uri:
        uri = get_management_db_uri()
        if uri.engine != 'pgsql':
            raise Error(
                'Only PostgreSQL systems can host Marts'
            )
    return uri

