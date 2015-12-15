#
# Copyright (c) 2015, Prometheus Research, LLC
#


from collections import Counter

from rex.core import Error, StrVal, RecordVal, MaybeVal, ChoiceVal, SeqVal, \
    MapVal, guard, OneOrSeqVal, OneOfVal, BoolVal
from rex.deploy import Driver

from .util import make_safe_token, RESTR_SAFE_TOKEN


__all__ = (
    'MartBaseTypeVal',
    'MartBaseVal',
    'EtlScriptTypeVal',
    'EtlScriptVal',
    'IdentifiableTypeVal',
    'ParentalRelationshipVal',
    'ParentalRelationshipTypeVal',
    'DataTypeVal',
    'MetadataFieldVal',
    'PostLoadCalculationsVal',
    'AssessmentDefinitionVal',
    'DefinitionVal',
    'MartConfigurationVal',
    'RunListEntryVal',
    'RunListVal',
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


class NormalizedOneOrSeqVal(OneOrSeqVal):
    def __call__(self, data):
        value = super(NormalizedOneOrSeqVal, self).__call__(data)
        if not isinstance(value, list):
            value = [value]
        return value

    def construct(self, loader, node):
        data = super(NormalizedOneOrSeqVal, self).construct(loader, node)
        # pylint: disable=not-callable
        return self(data)


class MartBaseTypeVal(ChoiceVal):
    """
    Parses/Validates the allowable values for ``base.type`` properties.
    """

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
            ('name_token', MaybeVal(StrVal(RESTR_SAFE_TOKEN)), None),

            # The static name to use for the database instead of the generated,
            # unique one.
            ('fixed_name', StrVal(RESTR_SAFE_TOKEN), None),
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

        with guard('While validating field:', 'fixed_name'):
            with guard('Got:', repr(value.fixed_name)):
                if value.type == 'existing' and value.fixed_name is not None:
                    raise Error(
                        'Base type "existing" cannot have a fixed name'
                    )

        return value


DEFAULT_MART_BASE = MartBaseVal().record_type(
    type='fresh',
    target=None,
    name_token=None,
    fixed_name=None,
)


class EtlScriptTypeVal(ChoiceVal):
    """
    Parses/Validates the allowable values for script ``type`` properties.
    """

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


class IdentifiableTypeVal(ChoiceVal):
    """
    Parses/Validates the allowable values for assessment ``identifiable``
    properties.
    """

    def __init__(self):
        super(IdentifiableTypeVal, self).__init__(
            'any',
            'only',
            'none',
        )


class ParentalRelationshipTypeVal(ChoiceVal):
    """
    Parses/Validates the allowable values for assessment parental relationship
    ``type`` properties.
    """

    def __init__(self):
        super(ParentalRelationshipTypeVal, self).__init__(
            'trunk',
            'facet',
            'branch',
            'cross',
            'ternary',
        )


class ParentalRelationshipVal(FullyValidatingRecordVal):
    """
    Parses/Validates the ``parental_relationship`` property within an
    Assessment definition.
    """

    def __init__(self):
        super(ParentalRelationshipVal, self).__init__(
            # The relationship type.
            ('type', ParentalRelationshipTypeVal),

            # The parent table(s) to hang the Assessment off of.
            ('parent', NormalizedOneOrSeqVal(StrVal), []),
        )

    def __call__(self, data):
        value = super(ParentalRelationshipVal, self).__call__(data)

        with guard('While validating field:', 'parent'):
            with guard('Got:', repr(value.parent)):
                if value.type == 'trunk' and len(value.parent) > 0:
                    raise Error(
                        'Relationship type "trunk" cannot have any parents',
                    )

                elif value.type in ('facet', 'branch') \
                        and len(value.parent) != 1:
                    raise Error(
                        'Relationship type "%s" must have exactly one'
                        ' parent' % (
                            value.type,
                        ),
                    )

                elif value.type in ('cross', 'ternary') \
                        and len(value.parent) < 2:
                    raise Error(
                        'Relationship type "%s" must have at least two'
                        ' parents' % (
                            value.type,
                        ),
                    )

        return value


DEFAULT_PARENTAL_RELATIONSHIP = ParentalRelationshipVal().record_type(
    type='trunk',
    parent=[],
)


class DataTypeVal(ChoiceVal):
    """
    Parses/Validates the allowable values for fields that indicate data types.
    """

    def __init__(self):
        super(DataTypeVal, self).__init__(
            'text',
            'integer',
            'float',
            'boolean',
            'date',
            'time',
            'dateTime',
        )


METADATA_TYPES = {
    'language': 'text',
    'application': 'text',
    'dateCompleted': 'dateTime',
    'timeTaken': 'integer',
}


class MetadataFieldVal(OneOfVal):
    """
    Parses/Validates a single Metadata Field filter.
    """

    def __init__(self):
        super(MetadataFieldVal, self).__init__(
            StrVal(),
            MapVal(
                StrVal,
                DataTypeVal,
            ),
        )

    def __call__(self, data):
        value = super(MetadataFieldVal, self).__call__(data)

        if isinstance(value, basestring):
            value = {value: METADATA_TYPES.get(value, 'text')}

        if len(value) > 1:
            raise Error('Mapping can only contain one element')

        name = value.keys()[0]
        if name == 'calculations':
            raise Error(
                'CalculationSet results are handled by the calculations'
                ' property'
            )

        if name in METADATA_TYPES \
                and value.values()[0] != METADATA_TYPES[name]:
            raise Error(
                'Cannot redefine the standard type for "%s"' % (
                    name,
                )
            )

        return value


class PostLoadCalculationsVal(FullyValidatingRecordVal):
    """
    Parses/Validates the configuration of a post-load Assessment Calculation.
    """

    def __init__(self):
        super(PostLoadCalculationsVal, self).__init__(
            # The name of the calculation.
            ('name', StrippedStrVal(RESTR_SAFE_TOKEN)),

            # The type of the resulting calculation.
            ('type', DataTypeVal),

            # The HTSQL expression that calculates the value.
            ('expression', StrippedStrVal),
        )


class AssessmentDefinitionVal(FullyValidatingRecordVal):
    """
    Parses/Validates a single Assessment definition.
    """

    def __init__(self):
        super(AssessmentDefinitionVal, self).__init__(
            # The Instrument(s) that define the structure of the Assessments.
            ('instrument', NormalizedOneOrSeqVal(StrVal)),

            # The name of the table to store the Assessments in.
            ('name', StrippedStrVal(RESTR_SAFE_TOKEN), None),

            # The HTSQL statement that will require the assessment_uid of the
            # Assessments to load into the table, as well as any other fields
            # to augment the table with.
            ('selector', StrippedStrVal),

            # Defines how/if this table is parented to another.
            (
                'parental_relationship',
                ParentalRelationshipVal,
                DEFAULT_PARENTAL_RELATIONSHIP,
            ),

            # Indicates whether/how to filter the Instrument fields based on
            # their identifiable flag in the Instrument.
            ('identifiable', IdentifiableTypeVal, 'any'),

            # The fields from the Instrument(s) to include.
            ('fields', MaybeVal(NormalizedOneOrSeqVal(StrVal)), []),

            # The calculations from the CalculationSet to include.
            ('calculations', MaybeVal(NormalizedOneOrSeqVal(StrVal)), []),

            # The Assessment-level metadata fields to include.
            ('meta', MaybeVal(NormalizedOneOrSeqVal(MetadataFieldVal)), None),

            # The Assessment-specific calculations to execute aft
            (
                'post_load_calculations',
                NormalizedOneOrSeqVal(PostLoadCalculationsVal),
                [],
            ),
        )

    def __call__(self, data):
        value = super(AssessmentDefinitionVal, self).__call__(data)

        if not value.name and value.instrument:
            # Default the name to be the same as the instrument.
            with guard('While validating field:', 'name'):
                safe_name = make_safe_token(value.instrument[0])
                value = value.__clone__(name=safe_name)

        # Make sure that we're actually including something from the Assessment
        if value.fields is None \
                and value.calculations is None \
                and not value.meta:
            raise Error(
                'Definition does not include any fields, calculations, or'
                ' metadata'
            )

        with guard('While validating field:', 'post_load_calculations'):
            names = [calc.name for calc in value.post_load_calculations]
            dupe_names = set([name for name in names if names.count(name) > 1])
            if dupe_names:
                raise Error(
                    'Calculation Names (%s) cannot be duplicated within an'
                    ' Assessment' % (
                        ', '.join(list(dupe_names)),
                    )
                )

        return value


class DefinitionVal(FullyValidatingRecordVal):
    """
    Parses/Validates a single Mart definition.
    """

    def __init__(self):
        super(DefinitionVal, self).__init__(
            # A unique identifier used to refer to this definition.
            ('id', StrVal(RESTR_SAFE_TOKEN)),

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

            # The Assessments to load into the Mart.
            ('assessments', SeqVal(AssessmentDefinitionVal), []),

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

        # Make sure we're not trying to load multiple assessment definitions
        # into the same table
        with guard('While validating field:', 'assessments'):
            names = [assessment.name for assessment in value.assessments]
            dupe_names = set([name for name in names if names.count(name) > 1])
            if dupe_names:
                raise Error(
                    'Assessment Names (%s) cannot be duplicated within a'
                    ' Definition' % (
                        ', '.join(list(dupe_names)),
                    )
                )

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


class RunListEntryVal(FullyValidatingRecordVal):
    """
    Parses/Validates a RunList entry
    """

    def __init__(self):
        super(RunListEntryVal, self).__init__(
            # The owner to assign the to Mart
            ('owner', StrVal()),

            # The Definition to use in the creation of the Mart
            ('definition', StrVal()),

            # Indicates whether or not to stop processing the runlist if this
            # entry fails
            ('halt_on_failure', BoolVal(), False),

            # Indicates whether or not to purge the database if this entry
            # fails
            ('purge_on_failure', BoolVal(), True),

            # Indicates whether or not to leave the status of this Mart should
            # be set to complete when creation is complete
            ('leave_incomplete', BoolVal(), False),
        )


class RunListVal(SeqVal):
    """
    Parses/Validates an entire RunList
    """

    def __init__(self):
        super(RunListVal, self).__init__(RunListEntryVal)

