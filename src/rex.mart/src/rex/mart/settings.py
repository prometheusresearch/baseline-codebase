#
# Copyright (c) 2015, Prometheus Research, LLC
#


from rex.core import Setting, StrVal, MaybeVal, Error, IntVal, BoolVal, SeqVal
from rex.db import DBVal, GatewaysSetting, HTSQLExtensionsSetting


__all__ = (
    'MartHostingClusterSetting',
    'MartNamePrefixSetting',
    'MartHtsqlExtensionsSetting',
    'MartEtlHtsqlGatewaysSetting',
    'MartEtlHtsqlExtensionsSetting',
    'MartMaxColumnsSetting',
    'MartMaxNameLengthSetting',
    'MartAllowRuntimeCreationSetting',
    'MartRuntimeCreationQueueSetting',
    'MartMaxMartsPerOwnerSetting',
    'MartDefaultMaxMartsPerOwnerDefinitionSetting',
    'MartHtsqlCacheDepthSetting',
)


class MartHostingClusterSetting(Setting):
    """
    Specifies the connection string used to access the database system where
    the Mart databases will be located.

    If not specified, the database system that houses the management database
    will be use to store the Marts.

    NOTE: Although this setting will require that you provide a database name
    as part of the connection string, it will not be used.
    """

    name = 'mart_hosting_cluster'
    default = None

    def validate(self, value):
        if value is not None:
            value = DBVal()(value)
            if value.engine != 'pgsql':
                raise Error(
                    'Only PostgreSQL systems can host Marts'
                )
        return value


class MartNamePrefixSetting(Setting):
    """
    Specifies a prefix that will be applied to the names of all Mart databases
    created by this application instance.

    If not specified, defaults to ``mart_``.
    """

    name = 'mart_name_prefix'
    validate = MaybeVal(StrVal(r'^[a-z0-9_]+$'))
    default = 'mart_'


class MartHtsqlExtensionsSetting(HTSQLExtensionsSetting):
    """
    Specifies any additional HTSQL extensions that will be enabled for the
    Mart HTSQL instances that are retrieved via the tools in this package.

    The ``rex_deploy`` and ``tweak.meta`` extensions will **always** be
    enabled, regardless of whether or not they are listed in this setting.
    """

    name = 'mart_htsql_extensions'
    default = {}


class MartEtlHtsqlGatewaysSetting(GatewaysSetting):
    """
    Specifies the HTSQL gateway configurations that will be made available for
    use during the execution of HTSQL ETL scripts.

    One gateway named ``rexdb`` will always be made available, and it will
    point to the management database. If you define a ``rexdb`` gateway in this
    setting, the default configuration will be merged into yours.
    """

    name = 'mart_etl_htsql_gateways'


class MartEtlHtsqlExtensionsSetting(HTSQLExtensionsSetting):
    """
    Specifies any additional HTSQL extensions that will be enabled for the
    execution of HTSQL ETL sripts.

    The ``rex_deploy``, ``tweak.etl``, and ``tweak.gateway`` extensions will
    **always** be enabled, regardless of whether or not they are listed in this
    setting.

    If not specified, this setting will only enable the ``tweak.meta``
    extension.
    """

    name = 'mart_etl_htsql_extensions'
    default = {
        'tweak.meta': {},
    }


class MartMaxColumnsSetting(Setting):
    """
    Specifies the maximum number of columns an Assessment-based table can have.

    If not specified, defaults to 1000.
    """

    name = 'mart_max_columns'
    validate = IntVal(min_bound=1)
    default = 1000


class MartMaxNameLengthSetting(Setting):
    """
    Specifies the maximum number of characters the name of an object (table,
    column, etc) in the databse can be.

    If not specified, defaults to 63.
    """

    name = 'mart_max_name_length'
    validate = IntVal(min_bound=1)
    default = 63


class MartAllowRuntimeCreationSetting(Setting):
    """
    Specifies whether or not to allow users to request the creation of Marts at
    runtime via the Web APIs.

    If not specified, defaults to ``False``.
    """

    name = 'mart_allow_runtime_creation'
    validate = BoolVal()
    default = False


class MartRuntimeCreationQueueSetting(Setting):
    """
    Specifies the rex.asynctask queue to drop messages in when Mart creation
    requests are received via the Web APIs.

    If not specified, defaults to ``rexmart_create``.
    """

    name = 'mart_runtime_creation_queue'
    validate = StrVal()
    default = 'rexmart_create'


class MartMaxMartsPerOwnerSetting(Setting):
    """
    Specifies the maximum number of Marts an owner can have in the system.

    If not specified, defaults to 10.
    """

    name = 'mart_max_marts_per_owner'
    validate = IntVal(min_bound=1)
    default = 10


class MartDefaultMaxMartsPerOwnerDefinitionSetting(Setting):
    """
    Specifies the default value to use in place of the ``quota.per_owner``
    property of a Mart definition, if no value is provided.

    If not specified, defaults to 3.
    """

    name = 'mart_default_max_marts_per_owner_definition'
    validate = IntVal(min_bound=1)
    default = 3


class MartHtsqlCacheDepthSetting(Setting):
    """
    Specifies how deep HTSQL connection caches should be.

    If not specified, defaults to 20.
    """

    name = 'mart_htsql_cache_depth'
    validate = IntVal(min_bound=1)
    default = 20


class MartDictionaryPresentationPrioritySetting(Setting):
    """
    Specifies the order of Presentation Types to consider when extracting
    metadata about Assessment table fields from Form/Interaction
    configurations.

    If not specified, defaults to: ``['form', 'sms']``
    """

    name = 'mart_dictionary_presentation_priority'
    validate = SeqVal(StrVal())
    default = ['form', 'sms']


class MartDictionaryChannelPrioritySetting(Setting):
    """
    Specifies the order of Channels to consider when extracting metadata about
    Assessment table fields from Form/Interaction configurations.

    If not specified, defaults to no priorities.
    """

    name = 'mart_dictionary_channel_priority'
    validate = SeqVal(StrVal())
    default = []

