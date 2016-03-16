#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import cached, get_packages, Error, get_settings

from .util import record_to_dict
from .validators import MartConfigurationVal


__all__ = (
    'MART_CONFIGURATION_FILE',
    'get_all_definitions',
    'get_definition',
    'get_hosting_db_uri',
    'get_management_db_uri',
)


#: The name/path to the rex.mart configuration file within a package's static
#: directory.
MART_CONFIGURATION_FILE = 'mart.yaml'


@cached
def get_all_definitions():
    """
    Returns all definitions configured in this application instance.

    :rtype: list(dict)
    """

    validator = MartConfigurationVal()
    definitions = []
    for package in reversed(get_packages()):
        if package.exists(MART_CONFIGURATION_FILE):
            definitions_path = package.abspath(MART_CONFIGURATION_FILE)
            cfg = validator.parse(open(definitions_path))
            if cfg.definitions:
                defns = [
                    record_to_dict(defn)
                    for defn in cfg.definitions
                ]
                for defn in defns:
                    defn['source_file'] = definitions_path
                definitions += defns

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

