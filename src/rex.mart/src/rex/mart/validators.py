#
# Copyright (c) 2015, Prometheus Research, LLC
#


from collections import Counter

from rex.core import Error, StrVal, RecordVal, MaybeVal, ChoiceVal, SeqVal, \
    MapVal, guard
from rex.deploy import Driver


__all__ = (
    'MartBaseVal',
    'EtlScriptVal',
    'DefinitionVal',
    'MartConfigurationVal',
)


class StrippedStrVal(StrVal):
    def __call__(self, data):
        value = super(StrippedStrVal, self).__call__(data)
        return value.strip()


class FullyValidatingRecordVal(RecordVal):
    def construct(self, loader, node):
        data = super(FullyValidatingRecordVal, self).construct(loader, node)
        # pylint: disable=not-callable
        return self(data)


class MartBaseTypeVal(ChoiceVal):
    def __init__(self):
        super(MartBaseTypeVal, self).__init__(
            'fresh',
            'copy',
            'existing',
        )


class MartBaseVal(FullyValidatingRecordVal):
    """
    Parses/Validates the ``base`` property within a Mart definition.
    """

    def __init__(self):
        super(MartBaseVal, self).__init__(
            # The creation type.
            ('type', MartBaseTypeVal),

            # For types that use other databases, the other database name.
            ('target', MaybeVal(StrVal(r'^.+$')), None),

            # The token to use as part of the name of the database that is
            # created.
            ('name_token', MaybeVal(StrVal(r'^[a-z_][0-9a-z_]*$')), None),
        )

    def __call__(self, data):
        value = super(MartBaseVal, self).__call__(data)

        with guard('While validating field:', 'target'):
            with guard('Got:', repr(value.target)):
                if value.type == 'fresh' and value.target is not None:
                    raise Error(
                        'Bases type "fresh" cannot have target database names'
                    )
                if value.type in ('copy', 'existing') and value.target is None:
                    raise Error(
                        'Base type of "%s" requires a target database name' % (
                            value.type,
                        )
                    )

        with guard('While validating field:', 'name_token'):
            with guard('Got:', repr(value.name_token)):
                if value.type == 'existing' and value.name_token is not None:
                    raise Error(
                        'Base type "existing" cannot have a name token'
                    )

        return value


DEFAULT_MART_BASE = MartBaseVal().record_type(
    type='fresh',
    target=None,
    name_token=None,
)


class EtlScriptTypeVal(ChoiceVal):
    def __init__(self):
        super(EtlScriptTypeVal, self).__init__(
            'htsql',
            'sql',
        )


class EtlScriptVal(FullyValidatingRecordVal):
    """
    Parses/Validates an ETL script entry in a Mart definition.
    """

    def __init__(self):
        super(EtlScriptVal, self).__init__(
            # The script to execute.
            ('script', StrippedStrVal),

            # The type of script it is.
            ('type', EtlScriptTypeVal),

            # Parameters to pass into this script.
            ('parameters', MapVal(), {}),
        )

    def __call__(self, data):
        value = super(EtlScriptVal, self).__call__(data)

        with guard('While validating field:', 'script'):
            with guard('Got:', repr(value.script)):
                if len(value.script) == 0:
                    raise Error('ETL Scripts cannot be empty')

        return value


class DefinitionVal(FullyValidatingRecordVal):
    """
    Parses/Validates a single Mart definition.
    """

    def __init__(self):
        super(DefinitionVal, self).__init__(
            # A unique identifier used to refer to this definition.
            ('id', StrVal(r'^[a-z_][0-9a-z_]*$')),

            # A human-readable label for this definition used for display in
            # GUIs.
            ('label', MaybeVal(StrVal), None),

            # A human-readable description of this definition.
            ('description', MaybeVal(StrippedStrVal), None),

            # What to use as the starting point for the Mart.
            ('base', MartBaseVal, DEFAULT_MART_BASE),

            # The rex.deploy configuration to apply to the Mart.
            ('deploy', MaybeVal(SeqVal(MapVal)), None),

            # The ETL scripts to execute after the rex.deploy configuration is
            # applied.
            ('post_deploy_scripts', SeqVal(EtlScriptVal), []),

            # The ETL scripts to execute after the Assessments have been
            # loaded.
            ('post_assessment_scripts', SeqVal(EtlScriptVal), []),
        )

    def __call__(self, data):
        value = super(DefinitionVal, self).__call__(data)

        with guard('While validating field:', 'deploy'):
            Driver.validate(value.deploy)

        if not value.label:
            # Default the label to be the same as the ID.
            value = value.__clone__(label=value.id)

        if not value.base.name_token and value.base.type != 'existing':
            # Default the name_token to be based off the ID.
            new_base = value.base.__clone__(
                name_token='%s_' % (value.id,),
            )
            value = value.__clone__(base=new_base)

        return value


class MartConfigurationVal(FullyValidatingRecordVal):
    """
    Parses/Validates an entire mart.yaml configuration.
    """

    def __init__(self):
        super(MartConfigurationVal, self).__init__(
            # The definitions configured for this instance.
            ('definitions', SeqVal(DefinitionVal), []),
        )

    def __call__(self, data):
        value = super(MartConfigurationVal, self).__call__(data)

        # Make sure there are no dupe IDs.
        dids = [defn.id for defn in value.definitions]
        dupe_dids = set([did for did in dids if dids.count(did) > 1])
        if dupe_dids:
            raise Error(
                'Definition IDs (%s) cannot be duplicated within a'
                ' collection' % (
                    ', '.join(list(dupe_dids)),
                )
            )

        # Make sure there aren't multiple definitions targetting the same
        # existing db.
        existing_counts = Counter([
            defn.base.target
            for defn in value.definitions
            if defn.base.type == 'existing'
        ])
        dupe_existings = [
            db_name
            for db_name, count in existing_counts.items()
            if count > 1
        ]
        if dupe_existings:
            raise Error(
                'Multiple definitions attempt to write to the same existing'
                ' database(s): %s' % (
                    ', '.join(dupe_existings),
                )
            )

        return value

