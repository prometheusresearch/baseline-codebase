#
# Copyright (c) 2015, Prometheus Research, LLC
#


from collections import Counter

from rex.core import Error, StrVal, RecordVal, MaybeVal, ChoiceVal, SeqVal, \
    MapVal, guard, OneOrSeqVal, OneOfVal, BoolVal, get_settings, IntVal, \
    AnyVal, FloatVal, UnionVal
from rex.deploy import Driver
from rex.instrument import Instrument
from rex.restful import DateVal, TimeVal, DateTimeVal

from .util import make_safe_token, RESTR_SAFE_TOKEN, record_to_dict, REQUIRED


__all__ = (
    'FullyValidatingRecordVal',
    'NormalizedOneOrSeqVal',
    'MartBaseTypeVal',
    'MartBaseVal',
    'QuotaVal',
    'ParameterVal',
    'EtlScriptTypeVal',
    'EtlScriptVal',
    'IdentifiableTypeVal',
    'ParentalRelationshipVal',
    'ParentalRelationshipTypeVal',
    'DataTypeVal',
    'MetadataFieldVal',
    'PostLoadCalculationsVal',
    'AssessmentDefinitionVal',
    'DynamicAssessmentVal',
    'ProcessorVal',
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
    """
    An enhanced version of the ``RecordVal`` validator that will always fully
    validate its subkeys whether the validator is invoke via YAML parsing or
    through direct value validation.
    """

    def construct(self, loader, node):
        data = super(FullyValidatingRecordVal, self).construct(loader, node)
        return self(data)


class NormalizedOneOrSeqVal(OneOrSeqVal):
    """
    An enhanced version of the ``OneOrSeqVal`` validator that will always
    result in a list value.
    """

    def __call__(self, data):
        value = super(NormalizedOneOrSeqVal, self).__call__(data)
        if not isinstance(value, list):
            value = [value]
        return value

    def construct(self, loader, node):
        data = super(NormalizedOneOrSeqVal, self).construct(loader, node)
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
            'application',
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
                if value.type in ('fresh', 'application') \
                        and value.target is not None:
                    raise Error(
                        'Bases type "%s" cannot have target database names' % (
                            value.type,
                        ),
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

                max_length = get_settings().mart_max_name_length
                if value.fixed_name and len(value.fixed_name) > max_length:
                    raise Error(
                        'Fixed name cannot be longer than %s characters' % (
                            max_length,
                        )
                    )

        return value


DEFAULT_MART_BASE = MartBaseVal().record_type(
    type='fresh',
    target=None,
    name_token=None,
    fixed_name=None,
)


class QuotaVal(FullyValidatingRecordVal):
    """
    Parses/Validates the ``quota`` property within a Mart definition.
    """

    def __init__(self):
        super(QuotaVal, self).__init__(
            # Maximum number of instances per owner.
            ('per_owner', IntVal(min_bound=1), None),
        )

    def __call__(self, data):
        value = super(QuotaVal, self).__call__(data)

        if value.per_owner is None:
            value = value.__clone__(
                per_owner=get_settings()
                .mart_default_max_marts_per_owner_definition,
            )

        return value


class ParameterVal(FullyValidatingRecordVal):
    """
    Parses/Validates a parameter entry in a Mart definition.
    """

    def __init__(self):
        super(ParameterVal, self).__init__(
            # The name of the parameter.
            ('name', StrVal(r'[a-zA-Z][a-zA-Z0-9_]*')),

            # The datatype of the value received by the parameter.
            ('type', DataTypeVal),

            # The default value of the parameter, if not specified.
            ('default', MaybeVal(AnyVal), REQUIRED),
        )

    def __call__(self, data):
        value = super(ParameterVal, self).__call__(data)

        if value.default != REQUIRED:
            with guard('While validating field:', 'default'):
                if value.default is not None:
                    value = value.__clone__(
                        default=DataTypeVal.get_validator(value.type)(
                            value.default,
                        ),
                    )

        return value


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
                if not value.script:
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
                if value.type == 'trunk' and value.parent:
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

    VALIDATORS = {
        'text': StrVal,
        'integer': IntVal,
        'float': FloatVal,
        'boolean': BoolVal,
        'date': DateVal,
        'time': TimeVal,
        'dateTime': DateTimeVal,
    }

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

    @classmethod
    def get_validator(cls, data_type):
        return cls.VALIDATORS[data_type]()


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


class SelectorVal(FullyValidatingRecordVal):
    """
    Parses/Validates an Assessment selector.
    """

    def __init__(self):
        super(SelectorVal, self).__init__(
            # The HTSQL query
            ('query', StrippedStrVal()),

            # Parameters to pass into this query
            ('parameters', MapVal(), {}),
        )

    def __call__(self, data):
        value = super(SelectorVal, self).__call__(data)

        with guard('While validating field:', 'query'):
            with guard('Got:', repr(value.query)):
                if not value.query:
                    raise Error('Selector querys cannot be empty')

        return value


class AlternateSelectorVal(OneOfVal):
    """
    Parses/Validates an Assessment selector.
    """

    def __init__(self):
        super(AlternateSelectorVal, self).__init__(
            StrippedStrVal(),
            SelectorVal(),
        )

    def __call__(self, data):
        value = super(AlternateSelectorVal, self).__call__(data)

        if isinstance(value, basestring):
            value = SelectorVal()({
                'query': value,
                'parameters': {},
            })

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


class AllOrOneOrSeqVal(NormalizedOneOrSeqVal):
    """
    Parses/Validates the configuration of the instrument property on an
    Assessment definition.
    """

    def __call__(self, data):
        if data == '@ALL':
            return data
        return super(AllOrOneOrSeqVal, self).__call__(data)


class AssessmentDefinitionVal(FullyValidatingRecordVal):
    """
    Parses/Validates a single Assessment definition.
    """

    def __init__(self):
        super(AssessmentDefinitionVal, self).__init__(
            # The Instrument(s) that define the structure of the Assessments.
            ('instrument', AllOrOneOrSeqVal(StrVal)),

            # The name of the table to store the Assessments in.
            ('name', StrippedStrVal(RESTR_SAFE_TOKEN), None),

            # The HTSQL query that will require the assessment_uid of the
            # Assessments to load into the table, as well as any other fields
            # to augment the table with.
            ('selector', AlternateSelectorVal),

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

            # The Assessment-specific calculation fields to execute after
            # they've been loaded into the database.
            (
                'post_load_calculations',
                NormalizedOneOrSeqVal(PostLoadCalculationsVal),
                [],
            ),
        )

    def __call__(self, data):
        value = super(AssessmentDefinitionVal, self).__call__(data)

        with guard('While validating field:', 'instrument'):
            if not value.instrument:
                raise Error('Assessment does not specify any instruments')

        if value.instrument != '@ALL':
            with guard('While validating field:', 'name'):
                if not value.name and value.instrument:
                    # Default the name to be the same as the instrument.
                    safe_name = make_safe_token(value.instrument[0])
                    value = value.__clone__(name=safe_name)

                elif value.name:
                    with guard('Got:', value.name):
                        max_length = get_settings().mart_max_name_length
                        max_length -= 3  # reserve room for numbering
                        if len(value.name) > max_length:
                            raise Error(
                                'Name cannot be longer than %s characters' % (
                                    max_length,
                                )
                            )

            # Make sure that we're actually including something from the
            # Assessment
            if value.fields is None \
                    and value.calculations is None \
                    and not value.meta:
                raise Error(
                    'Assessment does not include any fields, calculations, or'
                    ' metadata'
                )

            with guard('While validating field:', 'post_load_calculations'):
                names = [calc.name for calc in value.post_load_calculations]
                dupe_names = set([
                    name
                    for name in names
                    if names.count(name) > 1
                ])
                if dupe_names:
                    raise Error(
                        'Calculation Names (%s) cannot be duplicated within an'
                        ' Assessment' % (
                            ', '.join(list(dupe_names)),
                        )
                    )

        else:
            if value.name \
                    or value.fields != [] \
                    or value.calculations != [] \
                    or value.post_load_calculations:
                raise Error(
                    'The "name", "fields", "calculations", and'
                    ' "post_load_calculations" properties are not allowed when'
                    ' @ALL is specified for the instrument.'
                )

        return value


class DynamicAssessmentVal(FullyValidatingRecordVal):
    """
    Parses/Validates a single Dynamic Assessment definition.
    """

    def __init__(self):
        super(DynamicAssessmentVal, self).__init__(
            # The name of the Definer implementation to invoke.
            ('dynamic', StrippedStrVal),

            # Arbitrary options to pass to the Definer's get_assessments()
            # method.
            ('options', MapVal(), {}),
        )

    def __call__(self, data):
        value = super(DynamicAssessmentVal, self).__call__(data)

        from .definers import Definer

        with guard('While validating field:', 'dynamic'):
            with guard('Got:', value.dynamic):
                if value.dynamic not in Definer.mapped():
                    raise Error('Unknown Definer ID')

        return value


class ProcessorVal(FullyValidatingRecordVal):
    """
    Parses/Validates a Processor entry in a Mart definition.
    """

    def __init__(self):
        super(ProcessorVal, self).__init__(
            # The ID of the processor to execute.
            ('id', StrippedStrVal),

            # Options to pass into this processor.
            ('options', MapVal(), {}),
        )

    def __call__(self, data):
        value = super(ProcessorVal, self).__call__(data)

        from .processors import Processor

        with guard('While validating field:', 'id'):
            with guard('Got:', value.id):
                if value.id not in Processor.mapped():
                    raise Error('Unknown Processor ID')

        with guard('While validating field:', 'options'):
            options = Processor.mapped()[value.id].validate_options(
                value.options,
            )
            value = value.__clone__(options=record_to_dict(options))

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

            # Quota settings that limit how many instances of this definition
            # can exist.
            ('quota', MaybeVal(QuotaVal), None),

            # The rex.deploy configuration to apply to the Mart.
            ('deploy', MaybeVal(SeqVal(MapVal)), None),

            # General parameters that can be passed into the creation process
            # so they're available to all HTSQL/SQL configuration properties.
            ('parameters', SeqVal(ParameterVal), []),

            # The ETL scripts to execute after the rex.deploy configuration is
            # applied.
            ('post_deploy_scripts', SeqVal(EtlScriptVal), []),

            # The Assessments to load into the Mart.
            (
                'assessments',
                SeqVal(UnionVal(
                    ('instrument', AssessmentDefinitionVal()),
                    ('dynamic', DynamicAssessmentVal()),
                )),
                [],
            ),

            # The ETL scripts to execute after the Assessments have been
            # loaded.
            ('post_assessment_scripts', SeqVal(EtlScriptVal), []),

            # The Processors to execute after the final ETL phase.
            ('processors', SeqVal(ProcessorVal), []),
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
                name_token='%s_' % (make_safe_token(value.id),),
            )
            value = value.__clone__(base=new_base)

        if not value.quota:
            value = value.__clone__(quota=QuotaVal()({}))

        if value.base.name_token:
            system_name_length = 25  # code, spacer, datetime
            system_name_length += len(get_settings().mart_name_prefix)
            max_name_length = \
                get_settings().mart_max_name_length - system_name_length
            with guard('While validating field:', 'base.name_token'):
                with guard('Got:', value.base.name_token):
                    if len(value.base.name_token) > max_name_length:
                        raise Error(
                            'Name Token cannot exceed %s characters in'
                            ' length' % (
                                max_name_length,
                            )
                        )

        # Make sure we're not trying to load multiple assessment definitions
        # into the same table
        with guard('While validating field:', 'assessments'):
            assessments = []
            for assessment in value.assessments:
                if not hasattr(assessment, 'instrument'):
                    assessments.append(assessment)
                elif assessment.instrument != '@ALL':
                    assessments.append(assessment)
                else:
                    all_instruments = [
                        instrument
                        for instrument in Instrument.get_implementation().find(
                            status=Instrument.STATUS_ACTIVE,
                        )
                        if instrument.latest_version
                    ]
                    for instrument in all_instruments:
                        assessments.append(
                            AssessmentDefinitionVal()(assessment.__clone__(
                                instrument=instrument.code,
                            ))
                        )

            names = [
                assessment.name
                for assessment in assessments
                if hasattr(assessment, 'instrument')
            ]
            dupe_names = set([name for name in names if names.count(name) > 1])
            if dupe_names:
                raise Error(
                    'Assessment Names (%s) cannot be duplicated within a'
                    ' Definition' % (
                        ', '.join(list(dupe_names)),
                    )
                )
            value = value.__clone__(assessments=assessments)

        # Make sure we're not defining duplicate parameters.
        with guard('While validating field:', 'parameters'):
            names = [param.name for param in value.parameters]
            dupe_names = set([name for name in names if names.count(name) > 1])
            if dupe_names:
                raise Error(
                    'Parameter Names (%s) cannot be duplicated within a'
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

            # The parameters to pass in during the creation of the Mart
            ('parameters', MapVal(), {}),
        )


class RunListVal(SeqVal):
    """
    Parses/Validates an entire RunList
    """

    def __init__(self):
        super(RunListVal, self).__init__(RunListEntryVal)

