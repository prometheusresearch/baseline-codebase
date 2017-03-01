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

    >>> def pprint_statements(statements):
    ...     for statement in statements:
    ...         pprint(dict(statement._asdict()))


RexDeploy Fact Generation
=========================

A simple case with one version, and one field::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart1'},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'}]

A case with two versions, where a field is added::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart2',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart2')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart2'},
     {'column': 'assessment_uid',
      'of': u'mart2',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart2'},
     {'column': 'instrument_version_uid',
      'of': u'mart2',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart2', 'required': False, 'type': 'text'},
     {'column': u'bar', 'of': u'mart2', 'required': False, 'type': 'integer'}]

A case with two versions, where a field is added and one is redefined::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart3',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart3')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart3'},
     {'column': 'assessment_uid',
      'of': u'mart3',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart3'},
     {'column': 'instrument_version_uid',
      'of': u'mart3',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart3', 'required': False, 'type': 'float'},
     {'column': u'bar', 'of': u'mart3', 'required': False, 'type': 'integer'}]

A case with a recordList field::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart4',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart4')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart4'},
     {'column': 'assessment_uid',
      'of': u'mart4',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart4'},
     {'column': 'instrument_version_uid',
      'of': u'mart4',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart4', 'required': False, 'type': 'text'},
     {'table': u'mart4_bar'},
     {'link': u'mart4', 'of': u'mart4_bar', 'required': True},
     {'column': 'record_seq',
      'of': u'mart4_bar',
      'required': True,
      'type': 'integer'},
     {'identity': [u'mart4', {'record_seq': 'offset'}], 'of': u'mart4_bar'},
     {'column': u'subfield1',
      'of': u'mart4_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'subfield2',
      'of': u'mart4_bar',
      'required': False,
      'type': ['pear', 'apple', 'banana']}]

A case with a matrix field::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart5',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart5')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart5'},
     {'column': 'assessment_uid',
      'of': u'mart5',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart5'},
     {'column': 'instrument_version_uid',
      'of': u'mart5',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart5', 'required': False, 'type': 'text'},
     {'table': u'mart5_bar'},
     {'link': u'mart5', 'of': u'mart5_bar', 'required': True},
     {'identity': [u'mart5'], 'of': u'mart5_bar'},
     {'column': u'row1_column1',
      'of': u'mart5_bar',
      'required': False,
      'type': 'date'},
     {'column': u'row1_column2_bar',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row1_column2_foo',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row1_column2_baz',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row2_column1',
      'of': u'mart5_bar',
      'required': False,
      'type': 'date'},
     {'column': u'row2_column2_baz',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row2_column2_foo',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row2_column2_bar',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'}]

A case with a calculation::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart6',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart6')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart6'},
     {'column': 'assessment_uid',
      'of': u'mart6',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart6'},
     {'column': 'instrument_version_uid',
      'of': u'mart6',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart6', 'required': False, 'type': 'text'},
     {'column': u'calc1', 'of': u'mart6', 'required': False, 'type': 'integer'}]

A case with all data types::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'alltypes',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='alltypes')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'alltypes'},
     {'column': 'assessment_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'alltypes'},
     {'column': 'instrument_version_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'nullable_field',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'column': u'text_field',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'column': u'integer_field',
      'of': u'alltypes',
      'required': False,
      'type': 'integer'},
     {'column': u'float_field',
      'of': u'alltypes',
      'required': False,
      'type': 'float'},
     {'column': u'boolean_field',
      'of': u'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': u'date_field',
      'of': u'alltypes',
      'required': False,
      'type': 'date'},
     {'column': u'time_field',
      'of': u'alltypes',
      'required': False,
      'type': 'time'},
     {'column': u'datetime_field',
      'of': u'alltypes',
      'required': False,
      'type': 'datetime'},
     {'column': u'enumeration_field',
      'of': u'alltypes',
      'required': False,
      'type': ['baz', 'foo', 'bar']},
     {'column': u'enumerationset_field_baz',
      'default': False,
      'of': u'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_foo',
      'default': False,
      'of': u'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_bar',
      'default': False,
      'of': u'alltypes',
      'required': False,
      'type': 'boolean'},
     {'column': u'calc1', 'of': u'alltypes', 'required': False, 'type': 'integer'},
     {'column': u'calc2', 'of': u'alltypes', 'required': False, 'type': 'text'},
     {'table': u'alltypes_recordlist_field'},
     {'link': u'alltypes', 'of': u'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': u'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': [u'alltypes', {'record_seq': 'offset'}],
      'of': u'alltypes_recordlist_field'},
     {'column': u'subfield1',
      'of': u'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': u'subfield2',
      'of': u'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': u'alltypes_matrix_field'},
     {'link': u'alltypes', 'of': u'alltypes_matrix_field', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_matrix_field'},
     {'column': u'row1_col1',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row1_col2',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col1',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col2',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'}]

A case with enumeration fields with hyphens::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart13',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart13')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart13'},
     {'column': 'assessment_uid',
      'of': u'mart13',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart13'},
     {'column': 'instrument_version_uid',
      'of': u'mart13',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'enum_with_hyphens',
      'of': u'mart13',
      'required': False,
      'type': ['baz-baz', 'foo', 'bar']},
     {'column': u'enumset_with_hyphens_baz_baz',
      'default': False,
      'of': u'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumset_with_hyphens_foo',
      'default': False,
      'of': u'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumset_with_hyphens_bar',
      'default': False,
      'of': u'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': u'enum_with_numeric',
      'of': u'mart13',
      'required': False,
      'type': ['1', '0', 'foo42']},
     {'column': u'enumset_with_numeric_1',
      'default': False,
      'of': u'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumset_with_numeric_0',
      'default': False,
      'of': u'mart13',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumset_with_numeric_foo42',
      'default': False,
      'of': u'mart13',
      'required': False,
      'type': 'boolean'}]

A case with multiple Instruments being merged::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart1', 'mart2', 'mart3'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart1','mart2','mart3'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart1'},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'},
     {'column': u'bar', 'of': u'mart1', 'required': False, 'type': 'integer'}]

A case where we select a bunch of extra fields::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, id() :as other_id, status, evaluation_date}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart1'},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'other_id', 'of': u'mart1', 'required': False, 'type': 'text'},
     {'column': u'status',
      'of': u'mart1',
      'required': False,
      'type': [u'in-progress', u'completed']},
     {'column': u'evaluation_date',
      'of': u'mart1',
      'required': False,
      'type': 'date'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'}]

A case where we select some JSON-ish fields::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart8',
    ...     'selector': "/assessment{uid :as assessment_uid, calculation :as a_json_field, data :as a_fake_json_field}.filter(instrumentversion.instrument='mart8')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart8'},
     {'column': 'assessment_uid',
      'of': u'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart8'},
     {'column': 'instrument_version_uid',
      'of': u'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'a_json_field',
      'of': u'mart8',
      'required': False,
      'type': 'json'},
     {'column': u'a_fake_json_field',
      'of': u'mart8',
      'required': False,
      'type': 'text'},
     {'column': u'foo', 'of': u'mart8', 'required': False, 'type': 'text'},
     {'column': u'calc1', 'of': u'mart8', 'required': False, 'type': 'integer'},
     {'column': u'calc2', 'of': u'mart8', 'required': False, 'type': 'integer'}]

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
    [{'table': u'alltypes'},
     {'column': 'assessment_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'alltypes'},
     {'column': 'instrument_version_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'integer_field',
      'of': u'alltypes',
      'required': False,
      'type': 'integer'},
     {'column': u'calc1', 'of': u'alltypes', 'required': False, 'type': 'integer'},
     {'column': u'calc2', 'of': u'alltypes', 'required': False, 'type': 'text'},
     {'table': u'alltypes_recordlist_field'},
     {'link': u'alltypes', 'of': u'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': u'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': [u'alltypes', {'record_seq': 'offset'}],
      'of': u'alltypes_recordlist_field'},
     {'column': u'subfield2',
      'of': u'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': u'alltypes_matrix_field'},
     {'link': u'alltypes', 'of': u'alltypes_matrix_field', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_matrix_field'},
     {'column': u'row1_col2',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart8',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart8')",
    ...     'fields': None,
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart8'},
     {'column': 'assessment_uid',
      'of': u'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart8'},
     {'column': 'instrument_version_uid',
      'of': u'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'calc1', 'of': u'mart8', 'required': False, 'type': 'integer'},
     {'column': u'calc2', 'of': u'mart8', 'required': False, 'type': 'integer'}]

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
    [{'table': u'mart8'},
     {'column': 'assessment_uid',
      'of': u'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart8'},
     {'column': 'instrument_version_uid',
      'of': u'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart8', 'required': False, 'type': 'text'},
     {'column': u'calc2', 'of': u'mart8', 'required': False, 'type': 'integer'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart8',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart8')",
    ...     'calculations': None,
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart8'},
     {'column': 'assessment_uid',
      'of': u'mart8',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart8'},
     {'column': 'instrument_version_uid',
      'of': u'mart8',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart8', 'required': False, 'type': 'text'}]

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
    [{'table': u'mart1'},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'},
     {'column': u'meta_datecompleted',
      'of': u'mart1',
      'required': False,
      'type': 'datetime'},
     {'column': u'meta_application',
      'of': u'mart1',
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
    [{'table': u'mart9'},
     {'column': 'assessment_uid',
      'of': u'mart9',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart9'},
     {'column': 'instrument_version_uid',
      'of': u'mart9',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart9', 'required': False, 'type': 'text'}]

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart9',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart9')",
    ...     'identifiable': 'none',
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart9'},
     {'column': 'assessment_uid',
      'of': u'mart9',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart9'},
     {'column': 'instrument_version_uid',
      'of': u'mart9',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'bar', 'of': u'mart9', 'required': False, 'type': 'integer'}]

Merging recordList changes::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart4', 'mart10'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart4','mart10'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart4'},
     {'column': 'assessment_uid',
      'of': u'mart4',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart4'},
     {'column': 'instrument_version_uid',
      'of': u'mart4',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart4', 'required': False, 'type': 'text'},
     {'table': u'mart4_bar'},
     {'link': u'mart4', 'of': u'mart4_bar', 'required': True},
     {'column': 'record_seq',
      'of': u'mart4_bar',
      'required': True,
      'type': 'integer'},
     {'identity': [u'mart4', {'record_seq': 'offset'}], 'of': u'mart4_bar'},
     {'column': u'subfield1',
      'of': u'mart4_bar',
      'required': False,
      'type': 'text'},
     {'column': u'subfield2',
      'of': u'mart4_bar',
      'required': False,
      'type': ['pear', 'apple', 'banana']},
     {'column': u'baz', 'of': u'mart4_bar', 'required': False, 'type': 'date'}]

Merging matrix changes::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart5', 'mart11'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart5','mart11'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart5'},
     {'column': 'assessment_uid',
      'of': u'mart5',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart5'},
     {'column': 'instrument_version_uid',
      'of': u'mart5',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart5', 'required': False, 'type': 'text'},
     {'table': u'mart5_bar'},
     {'link': u'mart5', 'of': u'mart5_bar', 'required': True},
     {'identity': [u'mart5'], 'of': u'mart5_bar'},
     {'column': u'row1_column1',
      'of': u'mart5_bar',
      'required': False,
      'type': 'datetime'},
     {'column': u'row1_column2_bar',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row1_column2_foo',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row1_column2_baz',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row2_column1',
      'of': u'mart5_bar',
      'required': False,
      'type': 'date'},
     {'column': u'row2_column2_baz',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row2_column2_foo',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row2_column2_bar',
      'default': False,
      'of': u'mart5_bar',
      'required': False,
      'type': 'boolean'},
     {'column': u'row1_newcolumn',
      'of': u'mart5_bar',
      'required': False,
      'type': 'float'},
     {'column': u'anotherrow_column1',
      'of': u'mart5_bar',
      'required': False,
      'type': 'datetime'},
     {'column': u'anotherrow_newcolumn',
      'of': u'mart5_bar',
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
    [{'table': u'mart1'},
     {'link': 'parent1', 'of': u'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'}]

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
    [{'table': u'mart1'},
     {'link': 'parent1', 'of': u'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1', 'assessment_uid'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'}]

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
    [{'table': u'mart1'},
     {'link': 'parent1', 'of': u'mart1', 'required': True},
     {'link': 'parent2', 'of': u'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1', 'parent2'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'}]

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
    [{'table': u'mart1'},
     {'link': 'parent1', 'of': u'mart1', 'required': True},
     {'link': 'parent2', 'of': u'mart1', 'required': True},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['parent1', 'parent2', 'assessment_uid'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'}]

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
    [{'table': u'alltypes'},
     {'column': 'assessment_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'alltypes'},
     {'column': 'instrument_version_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'nullable_field',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'column': u'text_field',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'column': u'integer_field',
      'of': u'alltypes',
      'required': False,
      'type': 'integer'},
     {'table': u'alltypes_recordlist_field'},
     {'link': u'alltypes', 'of': u'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': u'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': [u'alltypes', {'record_seq': 'offset'}],
      'of': u'alltypes_recordlist_field'},
     {'column': u'subfield1',
      'of': u'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': u'subfield2',
      'of': u'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': u'alltypes_matrix_field'},
     {'link': u'alltypes', 'of': u'alltypes_matrix_field', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_matrix_field'},
     {'column': u'row1_col1',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row1_col2',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col1',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col2',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'table': u'alltypes_2'},
     {'link': u'alltypes', 'of': u'alltypes_2', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_2'},
     {'column': u'float_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'float'},
     {'column': u'boolean_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'boolean'},
     {'column': u'date_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'date'},
     {'column': u'time_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'time'},
     {'table': u'alltypes_3'},
     {'link': u'alltypes', 'of': u'alltypes_3', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_3'},
     {'column': u'datetime_field',
      'of': u'alltypes_3',
      'required': False,
      'type': 'datetime'},
     {'column': u'enumeration_field',
      'of': u'alltypes_3',
      'required': False,
      'type': ['baz', 'foo', 'bar']},
     {'column': u'enumerationset_field_baz',
      'default': False,
      'of': u'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_foo',
      'default': False,
      'of': u'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_bar',
      'default': False,
      'of': u'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': u'calc1',
      'of': u'alltypes_3',
      'required': False,
      'type': 'integer'},
     {'table': u'alltypes_4'},
     {'link': u'alltypes', 'of': u'alltypes_4', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_4'},
     {'column': u'calc2', 'of': u'alltypes_4', 'required': False, 'type': 'text'}]

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
    [{'table': u'alltypes'},
     {'column': 'assessment_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'alltypes'},
     {'column': 'instrument_version_uid',
      'of': u'alltypes',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'postcalc1',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'column': u'postcalc2',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'column': u'postcalc3',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'column': u'postcalc4',
      'of': u'alltypes',
      'required': False,
      'type': 'text'},
     {'table': u'alltypes_recordlist_field'},
     {'link': u'alltypes', 'of': u'alltypes_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': u'alltypes_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': [u'alltypes', {'record_seq': 'offset'}],
      'of': u'alltypes_recordlist_field'},
     {'column': u'subfield1',
      'of': u'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': u'subfield2',
      'of': u'alltypes_recordlist_field',
      'required': False,
      'type': 'text'},
     {'table': u'alltypes_matrix_field'},
     {'link': u'alltypes', 'of': u'alltypes_matrix_field', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_matrix_field'},
     {'column': u'row1_col1',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row1_col2',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col1',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col2',
      'of': u'alltypes_matrix_field',
      'required': False,
      'type': 'text'},
     {'table': u'alltypes_2'},
     {'link': u'alltypes', 'of': u'alltypes_2', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_2'},
     {'column': u'nullable_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'text'},
     {'column': u'text_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'text'},
     {'column': u'integer_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'integer'},
     {'column': u'float_field',
      'of': u'alltypes_2',
      'required': False,
      'type': 'float'},
     {'table': u'alltypes_3'},
     {'link': u'alltypes', 'of': u'alltypes_3', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_3'},
     {'column': u'boolean_field',
      'of': u'alltypes_3',
      'required': False,
      'type': 'boolean'},
     {'column': u'date_field',
      'of': u'alltypes_3',
      'required': False,
      'type': 'date'},
     {'column': u'time_field',
      'of': u'alltypes_3',
      'required': False,
      'type': 'time'},
     {'column': u'datetime_field',
      'of': u'alltypes_3',
      'required': False,
      'type': 'datetime'},
     {'table': u'alltypes_4'},
     {'link': u'alltypes', 'of': u'alltypes_4', 'required': True},
     {'identity': [u'alltypes'], 'of': u'alltypes_4'},
     {'column': u'enumeration_field',
      'of': u'alltypes_4',
      'required': False,
      'type': ['baz', 'foo', 'bar']},
     {'column': u'enumerationset_field_baz',
      'default': False,
      'of': u'alltypes_4',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_foo',
      'default': False,
      'of': u'alltypes_4',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_bar',
      'default': False,
      'of': u'alltypes_4',
      'required': False,
      'type': 'boolean'},
     {'column': u'calc1',
      'of': u'alltypes_4',
      'required': False,
      'type': 'integer'},
     {'column': u'calc2', 'of': u'alltypes_4', 'required': False, 'type': 'text'}]


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
     {'column': u'nullable_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'text'},
     {'column': u'text_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'text'},
     {'column': u'integer_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'integer'},
     {'column': u'float_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'float'},
     {'column': u'boolean_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': u'date_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'date'},
     {'column': u'time_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'time'},
     {'column': u'datetime_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'datetime'},
     {'column': u'enumeration_field',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': ['baz', 'foo', 'bar']},
     {'column': u'enumerationset_field_baz',
      'default': False,
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_foo',
      'default': False,
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': u'enumerationset_field_bar',
      'default': False,
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'boolean'},
     {'column': u'calc1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'required': False,
      'type': 'integer'},
     {'column': u'calc2',
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
     {'column': u'subfield1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2',
      'required': False,
      'type': 'text'},
     {'column': u'subfield2',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_recordl_2',
      'required': False,
      'type': 'text'},
     {'table': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3'},
     {'link': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': True},
     {'identity': ['qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm'],
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3'},
     {'column': u'row1_col1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'},
     {'column': u'row1_col2',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col1',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'},
     {'column': u'row2_col2',
      'of': 'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm_matrix_3',
      'required': False,
      'type': 'text'}]

If a table is found to have fields with duplicate names (after they've already
been truncated and stripped of illegal characters), it will add unique indexes
to their name::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, uid :as qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnm, uid :as qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqqq, uid :as qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart1'},
     {'column': 'assessment_uid',
      'of': u'mart1',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart1'},
     {'column': 'instrument_version_uid',
      'of': u'mart1',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_1',
      'of': u'mart1',
      'required': False,
      'type': 'text'},
     {'column': u'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_2',
      'of': u'mart1',
      'required': False,
      'type': 'text'},
     {'column': u'qwertyuiopasdfghjklzxcvbnmqwertyuiopasdfghjklzxcvbnmqwertyui_3',
      'of': u'mart1',
      'required': False,
      'type': 'text'},
     {'column': u'foo', 'of': u'mart1', 'required': False, 'type': 'text'}]


If an Instrument contains field names that overlap with column names that are
used to build the basic table structures, they'll be renamed to ``*_src``::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart12',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart12')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint(table.get_deploy_facts())
    [{'table': u'mart12'},
     {'column': 'assessment_uid',
      'of': u'mart12',
      'required': True,
      'title': 'Assessment UID',
      'type': 'text'},
     {'identity': ['assessment_uid'], 'of': u'mart12'},
     {'column': 'instrument_version_uid',
      'of': u'mart12',
      'required': True,
      'title': 'InstrumentVersion UID',
      'type': 'text'},
     {'column': u'foo', 'of': u'mart12', 'required': False, 'type': 'text'},
     {'column': u'assessment_uid_src',
      'of': u'mart12',
      'required': False,
      'type': 'text'},
     {'column': u'instrument_version_uid_src',
      'of': u'mart12',
      'required': False,
      'type': 'text'},
     {'table': u'mart12_recordlist_field'},
     {'link': u'mart12', 'of': u'mart12_recordlist_field', 'required': True},
     {'column': 'record_seq',
      'of': u'mart12_recordlist_field',
      'required': True,
      'type': 'integer'},
     {'identity': [u'mart12', {'record_seq': 'offset'}],
      'of': u'mart12_recordlist_field'},
     {'column': u'subfield1',
      'of': u'mart12_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': u'mart12_src',
      'of': u'mart12_recordlist_field',
      'required': False,
      'type': 'text'},
     {'column': u'record_seq_src',
      'of': u'mart12_recordlist_field',
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
    Error: An Instrument with UID "doesntexist" could not be found

Specified Instrument doesn't have any versions::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'noversions',
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='noversions')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    Error: No InstrumentVersions for UID "noversions" exist

Missing the ``assessment_uid`` field in the selector::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{status}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    Error: Selector does not include "assessment_uid" field specifying Assessment UIDs

Selector has duplicate field names::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': 'mart1',
    ...     'selector': "/assessment{uid :as assessment_uid, status, evaluation_date :as status}.filter(instrumentversion.instrument='mart1')",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    Error: Selector includes multiple fields with the same name: status

Trying to merge Instruments/InstrumentVersion with incompatible field
redefinitions::

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart2', 'mart4'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart2','mart4'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    Error: Cannot merge a recordList field with any other type of field (bar)

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart4', 'mart2'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart2','mart4'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    Error: Cannot merge a "integer" field with a complex field (bar)

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart2', 'mart5'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart2','mart5'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    Error: Cannot merge a matrix field with any other type of field (bar)

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['mart1', 'mart7'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument={'mart1','mart7'})",
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    Traceback (most recent call last):
        ...
    Error: Cannot merge fields of types text and enumerationSet (foo)

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
    Error: Selector is missing fields declared as parental links: parent1


Data Loading
============

HTSQL Statements
-----------------

Given an Assessment, the table mapping can generate the statements and
associated parameters necessary to insert the data from the assessment into
the tables created by deploy facts::

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
    >>> pprint_statements(table.get_statements_for_assessment(assessment, 'alltypes1'))
    {'htsql': u'/{$assessment_uid :as assessment_uid, $instrument_version_uid :as instrument_version_uid, $float_field :as float_field, $integer_field :as integer_field, $time_field :as time_field, $calc1 :as calc1, $calc2 :as calc2, $enumerationset_field_foo :as enumerationset_field_foo, $boolean_field :as boolean_field, $datetime_field :as datetime_field, $enumerationset_field_bar :as enumerationset_field_bar, $date_field :as date_field, $enumeration_field :as enumeration_field, $text_field :as text_field, $nullable_field :as nullable_field} :as alltypes/:insert',
     'parameters': {u'boolean_field': True,
                    u'calc1': 46,
                    u'calc2': u'foo!',
                    u'date_field': datetime.date(2010, 1, 1),
                    u'datetime_field': datetime.datetime(2010, 1, 1, 12, 34, 56),
                    u'enumeration_field': u'foo',
                    u'enumerationset_field_bar': True,
                    u'enumerationset_field_foo': True,
                    u'float_field': 42.1,
                    u'integer_field': 23,
                    u'nullable_field': None,
                    u'text_field': u'foo',
                    u'time_field': datetime.time(12, 34, 56)}}
    {'htsql': u'/{$PRIMARY_TABLE_ID :as alltypes, $subfield2 :as subfield2, $subfield1 :as subfield1} :as alltypes_recordlist_field/:insert',
     'parameters': {u'subfield1': u'foo1', u'subfield2': u'bar1'}}
    {'htsql': u'/{$PRIMARY_TABLE_ID :as alltypes, $subfield2 :as subfield2, $subfield1 :as subfield1} :as alltypes_recordlist_field/:insert',
     'parameters': {u'subfield1': u'foo2', u'subfield2': u'bar2'}}
    {'htsql': u'/{$PRIMARY_TABLE_ID :as alltypes, $row1_col2 :as row1_col2, $row1_col1 :as row1_col1, $row2_col2 :as row2_col2, $row2_col1 :as row2_col1} :as alltypes_matrix_field/:insert',
     'parameters': {u'row1_col1': u'foo1',
                    u'row1_col2': u'bar1',
                    u'row2_col1': u'foo2',
                    u'row2_col2': u'bar2'}}
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
    >>> pprint_statements(table.get_statements_for_assessment(assessment, 'alltypes1'))
    {'htsql': u'/{$assessment_uid :as assessment_uid, $instrument_version_uid :as instrument_version_uid, $float_field :as float_field, $meta_application :as meta_application, $integer_field :as integer_field, $meta_datecompleted :as meta_datecompleted} :as alltypes/:insert',
     'parameters': {u'float_field': 42.1,
                    u'integer_field': 23,
                    u'meta_application': u'SomeApp/0.1',
                    u'meta_datecompleted': datetime.datetime(2015, 2, 3, 12, 34, 56)}}
    >>> pprint(table.get_calculation_statements())
    []

    >>> definition = AssessmentDefinitionVal()({
    ...     'instrument': ['alltypes'],
    ...     'selector': "/assessment{uid :as assessment_uid}.filter(instrumentversion.instrument='mart1')",
    ...     'fields': None,
    ...     'calculations': ['calc1'],
    ... })
    >>> table = PrimaryTable(definition, get_management_db())
    >>> pprint_statements(table.get_statements_for_assessment(assessment, 'alltypes1'))
    {'htsql': u'/{$assessment_uid :as assessment_uid, $instrument_version_uid :as instrument_version_uid, $calc1 :as calc1} :as alltypes/:insert',
     'parameters': {u'calc1': 46}}
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
    >>> pprint_statements(table.get_statements_for_assessment(assessment, 'alltypes1'))
    {'htsql': u'/{$assessment_uid :as assessment_uid, $instrument_version_uid :as instrument_version_uid, $float_field :as float_field, $calc1 :as calc1, $calc2 :as calc2, $integer_field :as integer_field} :as alltypes/:insert',
     'parameters': {u'calc1': 46,
                    u'calc2': u'foo!',
                    u'float_field': 42.1,
                    u'integer_field': 23}}
    >>> pprint(table.get_calculation_statements())
    [u'/alltypes.define($postcalc1 := upper(assessment_uid), $postcalc2 := upper(assessment_uid)){id(), $postcalc1 :as postcalc1, $postcalc2 :as postcalc2}/:update']


    >>> rex.off()

