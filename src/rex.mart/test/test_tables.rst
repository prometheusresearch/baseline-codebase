******
Tables
******


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()
    >>> from rex.mart import get_management_db, AssessmentDefinitionVal
    >>> from rex.mart.tables import PrimaryTable
    >>> from pprint import pprint


RexDeploy Fact Generation
=========================

A simple case with one version, and one field::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'}]

A case with two versions, where a field is added::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart2',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart2')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart2'},
     {'column': 'assessment_uid',
      'of': 'mart2',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart2'},
     {'column': 'instrument_version_uid',
      'of': 'mart2',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart2', 'required': False, 'type': 'text'},
     {'column': 'bar', 'of': 'mart2', 'required': False, 'type': 'integer'}]

A case with two versions, where a field is added and one is redefined::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart3',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart3')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart3'},
     {'column': 'assessment_uid',
      'of': 'mart3',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart3'},
     {'column': 'instrument_version_uid',
      'of': 'mart3',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart3', 'required': False, 'type': 'float'},
     {'column': 'bar', 'of': 'mart3', 'required': False, 'type': 'integer'}]

A case with a recordList field::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart4',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart4')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart4'},
     {'column': 'assessment_uid',
      'of': 'mart4',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart4'},
     {'column': 'instrument_version_uid',
      'of': 'mart4',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart4', 'required': False, 'type': 'text'},
     {'table': 'mart4_bar'},
     {'link': 'mart4', 'of': 'mart4_bar', 'required': True},
     {'column': 'record_seq',
      'of': 'mart4_bar',
      'required': True,
      'type': 'integer'},
     {'identity': ['mart4', {'record_seq': 'offset'}], 'of': 'mart4_bar'},
     {'column': 'subfield1',
      'of': 'mart4_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'subfield2',
      'of': 'mart4_bar',
      'required': False,
      'type': ['apple', 'banana', 'pear']}]

A case with a matrix field::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart5',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart5')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart5'},
     {'column': 'assessment_uid',
      'of': 'mart5',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart5'},
     {'column': 'instrument_version_uid',
      'of': 'mart5',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart5', 'required': False, 'type': 'text'},
     {'table': 'mart5_bar'},
     {'link': 'mart5', 'of': 'mart5_bar', 'required': True},
     {'identity': ['mart5'], 'of': 'mart5_bar'},
     {'column': 'row1_column1',
      'of': 'mart5_bar',
      'required': False,
      'type': 'date'},
     {'column': 'row1_column2_foo',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row1_column2_bar',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row1_column2_baz',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row2_column1',
      'of': 'mart5_bar',
      'required': False,
      'type': 'date'},
     {'column': 'row2_column2_foo',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row2_column2_bar',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row2_column2_baz',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'}]

A case with a calculation::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart6',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart6')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart6'},
     {'column': 'assessment_uid',
      'of': 'mart6',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart6'},
     {'column': 'instrument_version_uid',
      'of': 'mart6',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart6', 'required': False, 'type': 'text'},
     {'column': 'calc1', 'of': 'mart6', 'required': False, 'type': 'integer'}]

A case with all data types::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'alltypes',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='alltypes')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'alltypes'},
     {'column': 'assessment_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'alltypes'},
     {'column': 'instrument_version_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'nullable_field',
      'of': 'alltypes',
      'required': False,
      'type': 'text'},
     {'column': 'text_field', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'column': 'integer_field',
      'of': 'alltypes',
      'required': False,
      'type': 'integer'},
     {'column': 'float_field',
      'of': 'alltypes',
      'required': False,
      'type': 'float'},
     {'column': 'boolean_field',
      'of': 'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': 'date_field', 'of': 'alltypes', 'required': False, 'type': 'date'},
     {'column': 'time_field', 'of': 'alltypes', 'required': False, 'type': 'time'},
     {'column': 'datetime_field',
      'of': 'alltypes',
      'required': False,
      'type': 'datetime'},
     {'column': 'enumeration_field',
      'of': 'alltypes',
      'required': False,
      'type': ['foo', 'bar', 'baz']},
     {'column': 'enumerationset_field_foo',
      'default': False,
      'of': 'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_bar',
      'default': False,
      'of': 'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_baz',
      'default': False,
      'of': 'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': 'calc1', 'of': 'alltypes', 'required': False, 'type': 'integer'},
     {'column': 'calc2', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'table': 'alltypes_recordlist_field'},
     {'link': 'alltypes', 'of': 'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': 'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': ['alltypes', {'record_seq': 'offset'}],
      'of': 'alltypes_recordlist_field'},
     {'column': 'subfield1',
      'of': 'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': 'subfield2',
      'of': 'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': 'alltypes_matrix_field'},
     {'link': 'alltypes', 'of': 'alltypes_matrix_field', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_matrix_field'},
     {'column': 'row1_col1',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row1_col2',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col1',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col2',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'}]

A case with enumeration fields with hyphens::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart13',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart13')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart13'},
     {'column': 'assessment_uid',
      'of': 'mart13',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart13'},
     {'column': 'instrument_version_uid',
      'of': 'mart13',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'enum_with_hyphens',
      'of': 'mart13',
      'required': False,
      'type': ['foo', 'bar', 'baz-baz']},
     {'column': 'enumset_with_hyphens_foo',
      'default': False,
      'of': 'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumset_with_hyphens_bar',
      'default': False,
      'of': 'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumset_with_hyphens_baz_baz',
      'default': False,
      'of': 'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': 'enum_with_numeric',
      'of': 'mart13',
      'required': False,
      'type': ['foo42', '0', '1']},
     {'column': 'enumset_with_numeric_foo42',
      'default': False,
      'of': 'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumset_with_numeric_0',
      'default': False,
      'of': 'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumset_with_numeric_1',
      'default': False,
      'of': 'mart13',
      'required': False,
      'type': 'boolean'}]

A case with multiple Instruments being merged::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart1', 'mart2', 'mart3'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart1','mart2','mart3'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'},
     {'column': 'bar', 'of': 'mart1', 'required': False, 'type': 'integer'}]

A case where we select a bunch of extra fields::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, id() :as other_id, status, evaluation_date}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'other_id', 'of': 'mart1', 'required': False, 'type': 'text'},
     {'column': 'status',
      'of': 'mart1',
      'required': False,
      'type': ['in-progress', 'completed']},
     {'column': 'evaluation_date',
      'of': 'mart1',
      'required': False,
      'type': 'date'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'}]

A case where we select some JSON-ish fields::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart8',
    ...     'selector': "/assessment{uid :as assessment_uid, calculation :as a_json_field, data :as a_fake_json_field}.filter(instrumentversion.instrument='mart8')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart8'},
     {'column': 'assessment_uid',
      'of': 'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart8'},
     {'column': 'instrument_version_uid',
      'of': 'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'a_json_field', 'of': 'mart8', 'required': False, 'type': 'json'},
     {'column': 'a_fake_json_field',
      'of': 'mart8',
      'required': False,
      'type': 'text'},
     {'column': 'foo', 'of': 'mart8', 'required': False, 'type': 'text'},
     {'column': 'calc1', 'of': 'mart8', 'required': False, 'type': 'integer'},
     {'column': 'calc2', 'of': 'mart8', 'required': False, 'type': 'integer'}]

A case where the fields are filtered::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'alltypes',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='alltypes')",
    ...     'fields': [
    ...         'integer_field',
    ...         'matrix_field.row1.col2',
    ...         'recordlist_field.subfield2',
    ...     ],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'alltypes'},
     {'column': 'assessment_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'alltypes'},
     {'column': 'instrument_version_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'integer_field',
      'of': 'alltypes',
      'required': False,
      'type': 'integer'},
     {'column': 'calc1', 'of': 'alltypes', 'required': False, 'type': 'integer'},
     {'column': 'calc2', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'table': 'alltypes_recordlist_field'},
     {'link': 'alltypes', 'of': 'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': 'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': ['alltypes', {'record_seq': 'offset'}],
      'of': 'alltypes_recordlist_field'},
     {'column': 'subfield2',
      'of': 'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': 'alltypes_matrix_field'},
     {'link': 'alltypes', 'of': 'alltypes_matrix_field', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_matrix_field'},
     {'column': 'row1_col2',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart8',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart8')",
    ...     'fields': None,
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart8'},
     {'column': 'assessment_uid',
      'of': 'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart8'},
     {'column': 'instrument_version_uid',
      'of': 'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'calc1', 'of': 'mart8', 'required': False, 'type': 'integer'},
     {'column': 'calc2', 'of': 'mart8', 'required': False, 'type': 'integer'}]

A case where the calculations are filtered::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart8',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart8')",
    ...     'calculations': [
    ...         'calc2',
    ...     ],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart8'},
     {'column': 'assessment_uid',
      'of': 'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart8'},
     {'column': 'instrument_version_uid',
      'of': 'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart8', 'required': False, 'type': 'text'},
     {'column': 'calc2', 'of': 'mart8', 'required': False, 'type': 'integer'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart8',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart8')",
    ...     'calculations': None,
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart8'},
     {'column': 'assessment_uid',
      'of': 'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart8'},
     {'column': 'instrument_version_uid',
      'of': 'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart8', 'required': False, 'type': 'text'}]

A case where metadata fields are extracted::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ...     'meta': [
    ...         'dateCompleted',
    ...         {'application': 'text'},
    ...     ],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'},
     {'column': 'meta_datecompleted',
      'of': 'mart1',
      'required': False,
      'type': 'datetime'},
     {'column': 'meta_application',
      'of': 'mart1',
      'required': False,
      'type': 'text'}]

Cases where identifiable fields are filtered::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart9',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart9')",
    ...     'identifiable': 'only',
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart9'},
     {'column': 'assessment_uid',
      'of': 'mart9',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart9'},
     {'column': 'instrument_version_uid',
      'of': 'mart9',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart9', 'required': False, 'type': 'text'},
     {'column': 'calc2', 'of': 'mart9', 'required': False, 'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart9',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart9')",
    ...     'identifiable': 'none',
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart9'},
     {'column': 'assessment_uid',
      'of': 'mart9',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart9'},
     {'column': 'instrument_version_uid',
      'of': 'mart9',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'bar', 'of': 'mart9', 'required': False, 'type': 'integer'},
     {'column': 'calc1', 'of': 'mart9', 'required': False, 'type': 'integer'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart9b',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart9b')",
    ...     'identifiable': 'only',
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart9b'},
     {'column': 'assessment_uid',
      'of': 'mart9b',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart9b'},
     {'column': 'instrument_version_uid',
      'of': 'mart9b',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart9b', 'required': False, 'type': 'text'},
     {'column': 'bar', 'of': 'mart9b', 'required': False, 'type': 'integer'},
     {'table': 'mart9b_baz'},
     {'link': 'mart9b', 'of': 'mart9b_baz', 'required': True},
     {'column': 'record_seq',
      'of': 'mart9b_baz',
      'required': True,
      'type': 'integer'},
     {'identity': ['mart9b', {'record_seq': 'offset'}], 'of': 'mart9b_baz'},
     {'column': 'baz2', 'of': 'mart9b_baz', 'required': False, 'type': 'text'},
     {'table': 'mart9b_blah'},
     {'link': 'mart9b', 'of': 'mart9b_blah', 'required': True},
     {'identity': ['mart9b'], 'of': 'mart9b_blah'},
     {'column': 'row1_blah1',
      'of': 'mart9b_blah',
      'required': False,
      'type': 'text'},
     {'column': 'row2_blah1',
      'of': 'mart9b_blah',
      'required': False,
      'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart9b',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart9b')",
    ...     'identifiable': 'none',
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart9b'},
     {'column': 'assessment_uid',
      'of': 'mart9b',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart9b'},
     {'column': 'instrument_version_uid',
      'of': 'mart9b',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'table': 'mart9b_baz'},
     {'link': 'mart9b', 'of': 'mart9b_baz', 'required': True},
     {'column': 'record_seq',
      'of': 'mart9b_baz',
      'required': True,
      'type': 'integer'},
     {'identity': ['mart9b', {'record_seq': 'offset'}], 'of': 'mart9b_baz'},
     {'column': 'baz1', 'of': 'mart9b_baz', 'required': False, 'type': 'text'},
     {'table': 'mart9b_blah'},
     {'link': 'mart9b', 'of': 'mart9b_blah', 'required': True},
     {'identity': ['mart9b'], 'of': 'mart9b_blah'},
     {'column': 'row1_blah2',
      'of': 'mart9b_blah',
      'required': False,
      'type': 'integer'},
     {'column': 'row2_blah2',
      'of': 'mart9b_blah',
      'required': False,
      'type': 'integer'}]

Merging recordList changes::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart4', 'mart10'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart4','mart10'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart4'},
     {'column': 'assessment_uid',
      'of': 'mart4',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart4'},
     {'column': 'instrument_version_uid',
      'of': 'mart4',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart4', 'required': False, 'type': 'text'},
     {'table': 'mart4_bar'},
     {'link': 'mart4', 'of': 'mart4_bar', 'required': True},
     {'column': 'record_seq',
      'of': 'mart4_bar',
      'required': True,
      'type': 'integer'},
     {'identity': ['mart4', {'record_seq': 'offset'}], 'of': 'mart4_bar'},
     {'column': 'subfield1', 'of': 'mart4_bar', 'required': False, 'type': 'text'},
     {'column': 'subfield2',
      'of': 'mart4_bar',
      'required': False,
      'type': ['apple', 'banana', 'pear']},
     {'column': 'baz', 'of': 'mart4_bar', 'required': False, 'type': 'date'}]

Merging matrix changes::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart5', 'mart11'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart5','mart11'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart5'},
     {'column': 'assessment_uid',
      'of': 'mart5',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart5'},
     {'column': 'instrument_version_uid',
      'of': 'mart5',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart5', 'required': False, 'type': 'text'},
     {'table': 'mart5_bar'},
     {'link': 'mart5', 'of': 'mart5_bar', 'required': True},
     {'identity': ['mart5'], 'of': 'mart5_bar'},
     {'column': 'row1_column1',
      'of': 'mart5_bar',
      'required': False,
      'type': 'datetime'},
     {'column': 'row1_column2_foo',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row1_column2_bar',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row1_column2_baz',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row2_column1',
      'of': 'mart5_bar',
      'required': False,
      'type': 'date'},
     {'column': 'row2_column2_foo',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row2_column2_bar',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row2_column2_baz',
      'default': False,
      'of': 'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': 'row1_newcolumn',
      'of': 'mart5_bar',
      'required': False,
      'type': 'float'},
     {'column': 'anotherrow_column1',
      'of': 'mart5_bar',
      'required': False,
      'type': 'datetime'},
     {'column': 'anotherrow_newcolumn',
      'of': 'mart5_bar',
      'required': False,
      'type': 'float'}]

Creating tables with different types of parental linkages::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, subject.id() :as parent1}.filter(instrumentversion.instrument='mart1')",
    ...     'parental_relationship': {
    ...         'type': 'facet',
    ...         'parent': 'parent1',
    ...     },
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'link': 'parent1', 'of': 'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, subject.id() :as parent1}.filter(instrumentversion.instrument='mart1')",
    ...     'parental_relationship': {
    ...         'type': 'branch',
    ...         'parent': 'parent1',
    ...     },
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'link': 'parent1', 'of': 'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1', 'assessment_uid'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, subject.id() :as parent1, id() :as parent2}.filter(instrumentversion.instrument='mart1')",
    ...     'parental_relationship': {
    ...         'type': 'cross',
    ...         'parent': ['parent1', 'parent2'],
    ...     },
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'link': 'parent1', 'of': 'mart1', 'required': True},
     {'link': 'parent2', 'of': 'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1', 'parent2'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, subject.id() :as parent1, id() :as parent2}.filter(instrumentversion.instrument='mart1')",
    ...     'parental_relationship': {
    ...         'type': 'ternary',
    ...         'parent': ['parent1', 'parent2'],
    ...     },
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'link': 'parent1', 'of': 'mart1', 'required': True},
     {'link': 'parent2', 'of': 'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1', 'parent2', 'assessment_uid'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'}]

When the number of columns in a table exceeds the max, the remaining are split
off into a series of facet tables::

    >>> rex.off()
    >>> rex2 = Rex('rex.mart_demo', mart_max_columns=5)
    >>> rex2.on()

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'alltypes',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='alltypes')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'alltypes'},
     {'column': 'assessment_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'alltypes'},
     {'column': 'instrument_version_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'nullable_field',
      'of': 'alltypes',
      'required': False,
      'type': 'text'},
     {'column': 'text_field', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'column': 'integer_field',
      'of': 'alltypes',
      'required': False,
      'type': 'integer'},
     {'table': 'alltypes_recordlist_field'},
     {'link': 'alltypes', 'of': 'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': 'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': ['alltypes', {'record_seq': 'offset'}],
      'of': 'alltypes_recordlist_field'},
     {'column': 'subfield1',
      'of': 'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': 'subfield2',
      'of': 'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': 'alltypes_matrix_field'},
     {'link': 'alltypes', 'of': 'alltypes_matrix_field', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_matrix_field'},
     {'column': 'row1_col1',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row1_col2',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col1',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col2',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'table': 'alltypes_2'},
     {'link': 'alltypes', 'of': 'alltypes_2', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_2'},
     {'column': 'float_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'float'},
     {'column': 'boolean_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'boolean'},
     {'column': 'date_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'date'},
     {'column': 'time_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'time'},
     {'table': 'alltypes_3'},
     {'link': 'alltypes', 'of': 'alltypes_3', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_3'},
     {'column': 'datetime_field',
      'of': 'alltypes_3',
      'required': False,
      'type': 'datetime'},
     {'column': 'enumeration_field',
      'of': 'alltypes_3',
      'required': False,
      'type': ['foo', 'bar', 'baz']},
     {'column': 'enumerationset_field_foo',
      'default': False,
      'of': 'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_bar',
      'default': False,
      'of': 'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_baz',
      'default': False,
      'of': 'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': 'calc1', 'of': 'alltypes_3', 'required': False, 'type': 'integer'},
     {'table': 'alltypes_4'},
     {'link': 'alltypes', 'of': 'alltypes_4', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_4'},
     {'column': 'calc2', 'of': 'alltypes_4', 'required': False, 'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'alltypes',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='alltypes')",
    ...     'post_load_calculations': [
    ...         {'name': 'postcalc1', 'type': 'text', 'expression': "string(assessment_uid)"},
    ...         {'name': 'postcalc2', 'type': 'text', 'expression': "string(assessment_uid)"},
    ...         {'name': 'postcalc3', 'type': 'text', 'expression': "string(assessment_uid)"},
    ...         {'name': 'postcalc4', 'type': 'text', 'expression': "string(assessment_uid)"},
    ...     ],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'alltypes'},
     {'column': 'assessment_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'alltypes'},
     {'column': 'instrument_version_uid',
      'of': 'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'postcalc1', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'column': 'postcalc2', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'column': 'postcalc3', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'column': 'postcalc4', 'of': 'alltypes', 'required': False, 'type': 'text'},
     {'table': 'alltypes_recordlist_field'},
     {'link': 'alltypes', 'of': 'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': 'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': ['alltypes', {'record_seq': 'offset'}],
      'of': 'alltypes_recordlist_field'},
     {'column': 'subfield1',
      'of': 'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': 'subfield2',
      'of': 'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': 'alltypes_matrix_field'},
     {'link': 'alltypes', 'of': 'alltypes_matrix_field', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_matrix_field'},
     {'column': 'row1_col1',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row1_col2',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col1',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col2',
      'of': 'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'table': 'alltypes_2'},
     {'link': 'alltypes', 'of': 'alltypes_2', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_2'},
     {'column': 'nullable_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'text'},
     {'column': 'text_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'text'},
     {'column': 'integer_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'integer'},
     {'column': 'float_field',
      'of': 'alltypes_2',
      'required': False,
      'type': 'float'},
     {'table': 'alltypes_3'},
     {'link': 'alltypes', 'of': 'alltypes_3', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_3'},
     {'column': 'boolean_field',
      'of': 'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': 'date_field',
      'of': 'alltypes_3',
      'required': False,
      'type': 'date'},
     {'column': 'time_field',
      'of': 'alltypes_3',
      'required': False,
      'type': 'time'},
     {'column': 'datetime_field',
      'of': 'alltypes_3',
      'required': False,
      'type': 'datetime'},
     {'table': 'alltypes_4'},
     {'link': 'alltypes', 'of': 'alltypes_4', 'required': True},
     {'identity': ['alltypes'], 'of': 'alltypes_4'},
     {'column': 'enumeration_field',
      'of': 'alltypes_4',
      'required': False,
      'type': ['foo', 'bar', 'baz']},
     {'column': 'enumerationset_field_foo',
      'default': False,
      'of': 'alltypes_4',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_bar',
      'default': False,
      'of': 'alltypes_4',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_baz',
      'default': False,
      'of': 'alltypes_4',
      'required': False,
      'type': 'boolean'},
     {'column': 'calc1', 'of': 'alltypes_4', 'required': False, 'type': 'integer'},
     {'column': 'calc2', 'of': 'alltypes_4', 'required': False, 'type': 'text'}]


    >>> rex2.off()
    >>> rex.on()

If the Assessment has a longish name, the table names will be massaged::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'alltypes',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='alltypes')",
    ...     'name': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm'},
     {'column': 'assessment_uid',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'],
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm'},
     {'column': 'instrument_version_uid',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'nullable_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'text'},
     {'column': 'text_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'text'},
     {'column': 'integer_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'integer'},
     {'column': 'float_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'float'},
     {'column': 'boolean_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': 'date_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'date'},
     {'column': 'time_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'time'},
     {'column': 'datetime_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'datetime'},
     {'column': 'enumeration_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': ['foo', 'bar', 'baz']},
     {'column': 'enumerationset_field_foo',
      'default': False,
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_bar',
      'default': False,
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': 'enumerationset_field_baz',
      'default': False,
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': 'calc1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'integer'},
     {'column': 'calc2',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'text'},
     {'table': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2'},
     {'link': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2',
      'required': True},
     {'column': 'record_seq',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2',
      'required': True,
      'type': 'integer'},
     {'identity': ['qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
                   {'record_seq': 'offset'}],
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2'},
     {'column': 'subfield1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2',
      'required': False,
      'type': 'text'},
     {'column': 'subfield2',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2',
      'required': False,
      'type': 'text'},
     {'table': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3'},
     {'link': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': True},
     {'identity': ['qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm'],
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3'},
     {'column': 'row1_col1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'},
     {'column': 'row1_col2',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'},
     {'column': 'row2_col2',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'}]

If a table is found to have fields with duplicate names (after they've already
been truncated and stripped of illegal characters), it will add unique indexes
to their name::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, uid :as id, uid :as qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm, uid :as qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqqq, uid :as qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart1'},
     {'column': 'assessment_uid',
      'of': 'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart1'},
     {'column': 'instrument_version_uid',
      'of': 'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'id_', 'of': 'mart1', 'required': False, 'type': 'text'},
     {'column': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_1',
      'of': 'mart1',
      'required': False,
      'type': 'text'},
     {'column': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_2',
      'of': 'mart1',
      'required': False,
      'type': 'text'},
     {'column': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_3',
      'of': 'mart1',
      'required': False,
      'type': 'text'},
     {'column': 'foo', 'of': 'mart1', 'required': False, 'type': 'text'}]


If an Instrument contains field names that overlap with column names that are
used to build the basic table structures, they'll be renamed to ``*_src``::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart12',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart12')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': 'mart12'},
     {'column': 'assessment_uid',
      'of': 'mart12',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': 'mart12'},
     {'column': 'instrument_version_uid',
      'of': 'mart12',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': 'foo', 'of': 'mart12', 'required': False, 'type': 'text'},
     {'column': 'assessment_uid_src',
      'of': 'mart12',
      'required': False,
      'type': 'text'},
     {'column': 'instrument_version_uid_src',
      'of': 'mart12',
      'required': False,
      'type': 'text'},
     {'table': 'mart12_recordlist_field'},
     {'link': 'mart12', 'of': 'mart12_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': 'mart12_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': ['mart12', {'record_seq': 'offset'}],
      'of': 'mart12_recordlist_field'},
     {'column': 'subfield1',
      'of': 'mart12_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': 'mart12_src',
      'of': 'mart12_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': 'record_seq_src',
      'of': 'mart12_recordlist_field',
      'required': False,
      'type': 'text'}]


Errors
------

Specified Instrument doesn't exist::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'doesntexist',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='doesntexist')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: An Instrument with UID "doesntexist" could not be found

Specified Instrument doesn't have any versions::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'noversions',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='noversions')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: No InstrumentVersions for UID "noversions" exist

Missing the ``assessment_uid`` field in the selector::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{status}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: Selector does not include "assessment_uid" field specifying Assessment UIDs

Selector has duplicate field names::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, status, evaluation_date :as status}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: Selector includes multiple fields with the same name: status

Trying to merge Instruments/InstrumentVersion with incompatible field
redefinitions::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart2', 'mart4'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart2','mart4'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot merge a recordList field with any other type of field (bar)

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart4', 'mart2'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart2','mart4'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot merge a "integer" field with a complex field (bar)

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart2', 'mart5'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart2','mart5'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot merge a matrix field with any other type of field (bar)

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart1', 'mart7'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart1','mart7'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot merge fields of types text and enumerationSet (foo)

Selector missing parental links::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ...     'parental_relationship': {
    ...         'type': 'branch',
    ...         'parent': 'parent1',
    ...     },
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    rex.core.Error: Selector is missing fields declared as parental links: parent1


Data Loading
============

Port Data
---------

Given an Assessment, the table mapping can generate a port and an associated
dataset necessary to insert the data from the assessment into the tables
created by deploy facts::

    >>> assessment = {
    ...     "instrument": {"id": "urn:alltypes","version": "1.0"},
    ...     "values": {"nullable_field": {"value": None},"text_field": {"value": "foo"},"integer_field": {"value": 23},"float_field": {"value": 42.1},"boolean_field": {"value": True},"date_field": {"value": "2010-01-01"},"time_field": {"value": "12:34:56"},"datetime_field": {"value": "2010-01-01T12:34:56"},"enumeration_field": {"value": "foo"},"enumerationset_field": {"value": ["foo","bar"]},"recordlist_field": {"value": [{"subfield1": {"value": "foo1"},"subfield2": {"value": "bar1"}},{"subfield1": {"value": "foo2"},"subfield2": {"value": "bar2"}}]},"matrix_field": {"value": {"row1": {"col1": {"value": "foo1"},"col2": {"value": "bar1"}},"row2": {"col1": {"value": "foo2"},"col2": {"value": "bar2"}}}}},
    ...     "meta": {
    ...         "application": "SomeApp/0.1",
    ...         "dateCompleted": "2015-02-03T12:34:56",
    ...         "calculations": {
    ...             "calc1": 46,
    ...             "calc2": "foo!",
    ...         },
    ...     },
    ... }

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['alltypes'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_port_tree())
    {'entity': 'alltypes',
     'with': ['alltypes_recordlist_field', 'alltypes_matrix_field']}
    >>> pprint(table.get_port_data(assessment, 'alltypes1'))
    {'alltypes_matrix_field': {'row1_col1': 'foo1',
                               'row1_col2': 'bar1',
                               'row2_col1': 'foo2',
                               'row2_col2': 'bar2'},
     'alltypes_recordlist_field': [{'subfield1': 'foo1', 'subfield2': 'bar1'},
                                   {'subfield1': 'foo2', 'subfield2': 'bar2'}],
     'boolean_field': True,
     'calc1': 46,
     'calc2': 'foo!',
     'date_field': datetime.date(2010, 1, 1),
     'datetime_field': datetime.datetime(2010, 1, 1, 12, 34, 56),
     'enumeration_field': 'foo',
     'enumerationset_field_bar': True,
     'enumerationset_field_foo': True,
     'float_field': 42.1,
     'integer_field': 23,
     'nullable_field': None,
     'text_field': 'foo',
     'time_field': datetime.time(12, 34, 56)}
    >>> pprint(table.get_calculation_statements())
    []

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['alltypes'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ...     'fields': ['float_field', 'integer_field'],
    ...     'calculations': None,
    ...     'meta': ['application', 'dateCompleted'],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_port_tree())
    {'entity': 'alltypes', 'with': []}
    >>> pprint(table.get_port_data(assessment, 'alltypes1'))
    {'float_field': 42.1,
     'integer_field': 23,
     'meta_application': 'SomeApp/0.1',
     'meta_datecompleted': datetime.datetime(2015, 2, 3, 12, 34, 56)}
    >>> pprint(table.get_calculation_statements())
    []

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['alltypes'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ...     'fields': None,
    ...     'calculations': ['calc1'],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_port_data(assessment, 'alltypes1'))
    {'calc1': 46}
    >>> pprint(table.get_calculation_statements())
    []

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['alltypes'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ...     'fields': ['float_field', 'integer_field'],
    ...     'post_load_calculations': [
    ...         {'name': 'postcalc1', 'type': 'text', 'expression': "upper(assessment_uid)"},
    ...         {'name': 'postcalc2', 'type': 'text', 'expression': "upper(assessment_uid)"},
    ...     ],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_port_data(assessment, 'alltypes1'))
    {'calc1': 46, 'calc2': 'foo!', 'float_field': 42.1, 'integer_field': 23}
    >>> pprint(table.get_calculation_statements())
    ['/alltypes.define($postcalc1 := upper(assessment_uid), $postcalc2 := '
     'upper(assessment_uid)){id(), $postcalc1 :as postcalc1, $postcalc2 :as '
     'postcalc2}/:update']


    >>> rex.off()

