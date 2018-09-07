********
Creation
********


Set up the environment::

    >>> from rex.core import Rex
    >>> import sys; cluster = 'pgsql://:5433/mart' if hasattr(sys, 'MART_MULTICLUSTER_TEST') else None
    >>> rex = Rex('rex.mart_demo', mart_hosting_cluster=cluster)
    >>> rex.on()
    >>> from rex.mart import MartCreator

Some tools for testing::

    >>> from rex.mart import get_hosting_cluster, get_mart_db, get_management_db
    >>> def db_exists(name):
    ...     cluster = get_hosting_cluster()
    ...     return cluster.exists(name)
    >>> def db_inventory(name, detailed=None):
    ...     db = get_mart_db(name)
    ...     tables = db.produce("/meta(/table?name!='asynctask_queue'&name!~'rexmart')")
    ...     if not tables:
    ...         print('No tables found')
    ...         return
    ...     for table in tables:
    ...         cnt = db.produce('count(%s)' % (table[0],))
    ...         print('%s: %s' % (table[0], cnt.data))
    ...         if detailed and table[0] in detailed:
    ...             for rec in db.produce('/%s' % (table[0],)):
    ...                 print(tuple(rec))
    >>> def db_status(name):
    ...     db = get_management_db()
    ...     data = db.produce('/rexmart_inventory?name=$name', name=name)
    ...     if not data:
    ...         print('STATUS RECORD MISSING')
    ...     if len(data) > 1:
    ...         print('MULTIPLE STATUS RECORDS FOUND')
    ...     print('Definition: %s' % data[0].definition)
    ...     print('Status: %s' % data[0].status)
    ...     print('Owner: %s' % data[0].owner)
    ...     print('Has Size: %s' % (data[0].size > 0 if data[0].size is not None else False,))
    ...     print('Dates: %s %s' % (
    ...         bool(data[0].date_creation_started),
    ...         bool(data[0].date_creation_completed),
    ...     ))

A simple, empty Mart::

    >>> mc = MartCreator('test', 'empty')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    No tables found
    >>> db_status(mart.name)
    Definition: empty
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Copy an existing DB::

    >>> mc = MartCreator('test', 'just_copy')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    assessment: 26
    channel: 5
    draftform: 2
    draftinstrumentversion: 2
    entry: 10
    form: 8
    instrument: 24
    instrumentversion: 27
    interaction: 6
    job: 3
    people: 5
    subject: 7
    task: 8
    user: 2
    >>> db_status(mart.name)
    Definition: just_copy
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Copy the application DB::

    >>> mc = MartCreator('test', 'just_copy_application')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    assessment: 26
    channel: 5
    draftform: 2
    draftinstrumentversion: 2
    entry: 10
    form: 8
    instrument: 24
    instrumentversion: 27
    interaction: 6
    job: 3
    people: 5
    subject: 7
    task: 8
    user: 2
    >>> db_status(mart.name)
    Definition: just_copy_application
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Create a Mart that always ends up with the same database name::

    >>> mc = MartCreator('test', 'fixed_name')
    >>> mart1 = mc()
    >>> mart1.name
    'a_fixed_name_mart'
    >>> db_exists(mart1.name)
    True
    >>> db_inventory(mart1.name)
    foo: 5
    >>> db_status(mart1.name)
    Definition: fixed_name
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mart2 = mc()
    >>> mart2.name
    'a_fixed_name_mart'
    >>> db_exists(mart2.name)
    True
    >>> db_inventory(mart2.name)
    foo: 5
    >>> db_status(mart2.name)
    Definition: fixed_name
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mart1.name == mart2.name
    True
    >>> mart1.code == mart2.code
    False

Make a table and transfer some data into it::

    >>> mc = MartCreator('test', 'some_data')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 5
    >>> db_status(mart.name)
    Definition: some_data
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Make a table and transfer some data into it with multiple scripts/statements::

    >>> mc = MartCreator('test', 'some_more_data')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 21
    >>> db_status(mart.name)
    Definition: some_more_data
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Make a table and load some data into it with SQL::

    >>> mc = MartCreator('test', 'some_sql_data')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 1
    >>> db_status(mart.name)
    Definition: some_sql_data
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Make a table and load some data into it with multiple SQL scripts/statements::

    >>> mc = MartCreator('test', 'some_more_sql_data')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 4
    >>> db_status(mart.name)
    Definition: some_more_sql_data
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Make a table and load it with data using both ETL phases::

    >>> mc = MartCreator('test', 'both_etl_phases')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 25
    >>> db_status(mart.name)
    Definition: both_etl_phases
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Make a table and load it with data using script parameters::

    >>> mc = MartCreator('test', 'some_data_with_params')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['foo'])
    foo: 6
    ('bar', None)
    ('baz', None)
    ('blah', None)
    ('foo', None)
    ('some_data_with_params', None)
    ('test', None)
    >>> db_status(mart.name)
    Definition: some_data_with_params
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Load data into an existing database::

    >>> mc = MartCreator('test', 'existing')
    >>> mart = mc()
    >>> mart.name
    'mart_demo'
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    assessment: 26
    channel: 5
    draftform: 2
    draftinstrumentversion: 2
    entry: 10
    foo: 5
    form: 8
    instrument: 24
    instrumentversion: 27
    interaction: 6
    job: 3
    people: 5
    subject: 7
    task: 8
    user: 2
    >>> db_status(mart.name)
    Definition: existing
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

You can load Assessments into the Mart::

    >>> mc = MartCreator('test', 'simple_assessment')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    mart1: 8
    >>> db_status(mart.name)
    Definition: simple_assessment
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

You can load Assessments into the Mart and link the table to other tables in
the Mart::

    >>> mc = MartCreator('test', 'linked_assessment')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    mart1: 8
    subject: 7
    >>> db_status(mart.name)
    Definition: linked_assessment
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mc = MartCreator('test', 'linked_assessment_alltypes')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    alltypes: 5
    alltypes_matrix_field: 4
    alltypes_recordlist_field: 7
    subject: 7
    >>> db_status(mart.name)
    Definition: linked_assessment_alltypes
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

You can load Assessments into the Mart and peform calculations on their
contents::

    >>> mc = MartCreator('test', 'calculated_assessment')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['mart1'])
    mart1: 8
    ('martassessment1', 'mart11', 'MARTASSESSMENT1-1', 'MARTASSESSMENT1-2', 'MARTASSESSMENT1-3', 'foo1')
    ('martassessment2', 'mart11', 'MARTASSESSMENT2-1', 'MARTASSESSMENT2-2', 'MARTASSESSMENT2-3', 'foo2')
    ('martassessment3', 'mart11', 'MARTASSESSMENT3-1', 'MARTASSESSMENT3-2', 'MARTASSESSMENT3-3', 'foo3')
    ('martassessment4', 'mart11', 'MARTASSESSMENT4-1', 'MARTASSESSMENT4-2', 'MARTASSESSMENT4-3', 'foo4')
    ('martassessment5', 'mart11', 'MARTASSESSMENT5-1', 'MARTASSESSMENT5-2', 'MARTASSESSMENT5-3', 'foo5')
    ('martassessment6', 'mart11', 'MARTASSESSMENT6-1', 'MARTASSESSMENT6-2', 'MARTASSESSMENT6-3', 'foo6')
    ('martassessment7', 'mart11', 'MARTASSESSMENT7-1', 'MARTASSESSMENT7-2', 'MARTASSESSMENT7-3', 'foo7')
    ('martassessment8', 'mart11', 'MARTASSESSMENT8-1', 'MARTASSESSMENT8-2', 'MARTASSESSMENT8-3', 'foo8')
    >>> db_status(mart.name)
    Definition: calculated_assessment
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

You can load Assessments into the Mart and alter/update the tables created by
them in the ``post_assessment_scripts``::

    >>> mc = MartCreator('test', 'schema_modification')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['mart1'])
    mart1: 8
    ('martassessment1', 'mart11', 12, 'foo1', 'bar')
    ('martassessment2', 'mart11', 13, 'foo2', 'bar')
    ('martassessment3', 'mart11', 14, 'foo3', 'bar')
    ('martassessment4', 'mart11', 15, 'foo4', 'bar')
    ('martassessment5', 'mart11', 16, 'foo5', 'bar')
    ('martassessment6', 'mart11', 17, 'foo6', 'bar')
    ('martassessment7', 'mart11', 18, 'foo7', 'bar')
    ('martassessment8', 'mart11', 19, 'foo8', 'bar')
    >>> db_status(mart.name)
    Definition: schema_modification
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Your Assessment selector can include JSON-ish fields::

    >>> mc = MartCreator('test', 'select_json')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    driver: 1
    mart8: 1
    >>> db_status(mart.name)
    Definition: select_json
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Definitions can invoke post-processors::

    >>> mc = MartCreator('test', 'index_processor')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 0
    >>> db_status(mart.name)
    Definition: index_processor
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mc = MartCreator('test', 'analyze_processor')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 0
    >>> db_status(mart.name)
    Definition: analyze_processor
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mc = MartCreator('test', 'datadictionary_deployment')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['datadictionary_table', 'datadictionary_column', 'datadictionary_enumeration', 'foo'])
    datadictionary_column: 2
    (ID('foo'), 'col1', 'The First Column', None, None, 'text', None)
    (ID('foo'), 'col2', None, 'Test Description', None, 'enumeration', None)
    datadictionary_enumeration: 3
    (ID(ID('foo'), 'col2'), 'bar', None)
    (ID(ID('foo'), 'col2'), 'baz', 'Bazzerific Description')
    (ID(ID('foo'), 'col2'), 'foo', 'The FOO')
    datadictionary_table: 1
    ('foo', 'Foo Bars', 'A Description')
    foo: 0
    >>> db_status(mart.name)
    Definition: datadictionary_deployment
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mc = MartCreator('test', 'datadictionary_assessment')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['datadictionary_table', 'datadictionary_column', 'datadictionary_enumeration', 'foo'])
    datadictionary_column: 8
    (ID('mart1'), 'assessment_uid', 'Assessment UID', 'the UID of the Assessment', None, 'code', None)
    (ID('mart1'), 'foo', None, 'The foo value', 'RIOS Instrument', 'text', None)
    (ID('mart1'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart1'), 'mycoolfield', 'My Cool Field', None, 'RexMart Calculation', 'text', None)
    (ID('mart1'), 'subject', None, None, 'RexMart Calculation', 'link', ID('subject'))
    (ID('subject'), 'mart1', None, None, None, 'branch', ID('mart1'))
    (ID('subject'), 'mobile_tn', 'Title Number 2', None, 'THE SOURCE', 'text', None)
    (ID('subject'), 'uid', None, None, None, 'text', None)
    datadictionary_enumeration: 0
    datadictionary_table: 2
    ('mart1', 'RexMart Testcase #1', 'A description for the Instrument')
    ('subject', None, 'CUSTOM SUBJECT DESCRIPTION!')
    mart1: 8
    subject: 7
    >>> db_status(mart.name)
    Definition: datadictionary_assessment
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mc = MartCreator('test', 'datadictionary_alltypes')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['datadictionary_table', 'datadictionary_column', 'datadictionary_enumeration'])
    alltypes: 5
    alltypes_matrix_field: 4
    alltypes_recordlist_field: 7
    datadictionary_column: 27
    (ID('alltypes'), 'alltypes_matrix_field', None, None, None, 'facet', ID('alltypes_matrix_field'))
    (ID('alltypes'), 'alltypes_recordlist_field', None, None, None, 'branch', ID('alltypes_recordlist_field'))
    (ID('alltypes'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('alltypes'), 'boolean_field', None, None, 'RIOS Instrument', 'boolean', None)
    (ID('alltypes'), 'calc1', None, 'A simple calculation', 'RIOS Calculation Set', 'integer', None)
    (ID('alltypes'), 'calc2', None, None, 'RIOS Calculation Set', 'text', None)
    (ID('alltypes'), 'date_field', None, None, 'RIOS Instrument', 'date', None)
    (ID('alltypes'), 'datetime_field', None, None, 'RIOS Instrument', 'datetime', None)
    (ID('alltypes'), 'enumeration_field', None, None, 'RIOS Instrument', 'enumeration', None)
    (ID('alltypes'), 'enumerationset_field_bar', None, 'An enumerated set (bar)', 'RIOS Instrument', 'boolean', None)
    (ID('alltypes'), 'enumerationset_field_baz', None, 'An enumerated set (baz)', 'RIOS Instrument', 'boolean', None)
    (ID('alltypes'), 'enumerationset_field_foo', None, 'An enumerated set (foo)', 'RIOS Instrument', 'boolean', None)
    (ID('alltypes'), 'float_field', None, None, 'RIOS Instrument', 'float', None)
    (ID('alltypes'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('alltypes'), 'integer_field', None, None, 'RIOS Instrument', 'integer', None)
    (ID('alltypes'), 'nullable_field', None, None, 'RIOS Instrument', 'text', None)
    (ID('alltypes'), 'text_field', None, 'This is a text field!', 'RIOS Instrument', 'text', None)
    (ID('alltypes'), 'time_field', None, None, 'RIOS Instrument', 'time', None)
    (ID('alltypes_matrix_field'), 'alltypes', None, None, None, 'link', ID('alltypes'))
    (ID('alltypes_matrix_field'), 'row1_col1', None, 'Just a col1 field', 'RIOS Instrument', 'text', None)
    (ID('alltypes_matrix_field'), 'row1_col2', None, None, 'RIOS Instrument', 'text', None)
    (ID('alltypes_matrix_field'), 'row2_col1', None, 'Just a col1 field', 'RIOS Instrument', 'text', None)
    (ID('alltypes_matrix_field'), 'row2_col2', None, None, 'RIOS Instrument', 'text', None)
    (ID('alltypes_recordlist_field'), 'alltypes', None, None, None, 'link', ID('alltypes'))
    (ID('alltypes_recordlist_field'), 'record_seq', None, None, None, 'integer', None)
    (ID('alltypes_recordlist_field'), 'subfield1', None, 'The sub field', 'RIOS Instrument', 'text', None)
    (ID('alltypes_recordlist_field'), 'subfield2', None, None, 'RIOS Instrument', 'text', None)
    datadictionary_enumeration: 3
    (ID(ID('alltypes'), 'enumeration_field'), 'bar', None)
    (ID(ID('alltypes'), 'enumeration_field'), 'baz', None)
    (ID(ID('alltypes'), 'enumeration_field'), 'foo', None)
    datadictionary_table: 3
    ('alltypes', 'An Instrument With All Types', None)
    ('alltypes_matrix_field', 'An Instrument With All Types (matrix_field fields)', None)
    ('alltypes_recordlist_field', 'An Instrument With All Types (recordlist_field fields)', 'A list of records')
    >>> db_status(mart.name)
    Definition: datadictionary_alltypes
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> rex.off()

    >>> rex2 = Rex('rex.mart_demo', mart_dictionary_presentation_priority=['form', 'sms'], mart_dictionary_channel_priority=['entry', 'survey', 'mobile', 'fakesms'], mart_hosting_cluster=cluster)
    >>> rex2.on()
    >>> mc = MartCreator('test', 'form_metadata')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['datadictionary_table', 'datadictionary_column', 'datadictionary_enumeration'])
    datadictionary_column: 14
    (ID('mart14'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart14'), 'bar', None, 'Entry Text for Bar', 'RIOS Instrument', 'integer', None)
    (ID('mart14'), 'baz', None, 'Entry Text for Baz', 'RIOS Instrument', 'enumeration', None)
    (ID('mart14'), 'foo', None, 'Entry Text for Foo', 'RIOS Instrument', 'text', None)
    (ID('mart14'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart15'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'mart15_bar', None, None, None, 'facet', ID('mart15_bar'))
    (ID('mart15'), 'mart15_foo', None, None, None, 'branch', ID('mart15_foo'))
    (ID('mart15_bar'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_bar'), 'row1_col1', None, 'Entry Column1', 'RIOS Instrument', 'text', None)
    (ID('mart15_foo'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_foo'), 'record_seq', None, None, None, 'integer', None)
    (ID('mart15_foo'), 'sub1', None, 'Entry Subfield1', 'RIOS Instrument', 'text', None)
    datadictionary_enumeration: 2
    (ID(ID('mart14'), 'baz'), 'happy', 'Entry Happy')
    (ID(ID('mart14'), 'baz'), 'sad', 'Entry Sad')
    datadictionary_table: 4
    ('mart14', 'Survey Title', None)
    ('mart15', 'RexMart Testcase #15', None)
    ('mart15_bar', 'RexMart Testcase #15 (bar fields)', 'Entry Text for Bar')
    ('mart15_foo', 'RexMart Testcase #15 (foo fields)', 'Entry Text for Foo')
    mart14: 0
    mart15: 0
    mart15_bar: 0
    mart15_foo: 0
    >>> db_status(mart.name)
    Definition: form_metadata
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True
    >>> rex2.off()

    >>> rex2 = Rex('rex.mart_demo', mart_dictionary_presentation_priority=['form', 'sms'], mart_dictionary_channel_priority=['survey', 'entry', 'mobile', 'fakesms'], mart_hosting_cluster=cluster)
    >>> rex2.on()
    >>> mc = MartCreator('test', 'form_metadata')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['datadictionary_table', 'datadictionary_column', 'datadictionary_enumeration'])
    datadictionary_column: 14
    (ID('mart14'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart14'), 'bar', None, 'Survey Text for Bar', 'RIOS Instrument', 'integer', None)
    (ID('mart14'), 'baz', None, 'Survey Text for Baz', 'RIOS Instrument', 'enumeration', None)
    (ID('mart14'), 'foo', None, 'Survey Text for Foo', 'RIOS Instrument', 'text', None)
    (ID('mart14'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart15'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'mart15_bar', None, None, None, 'facet', ID('mart15_bar'))
    (ID('mart15'), 'mart15_foo', None, None, None, 'branch', ID('mart15_foo'))
    (ID('mart15_bar'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_bar'), 'row1_col1', None, 'Survey Column1', 'RIOS Instrument', 'text', None)
    (ID('mart15_foo'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_foo'), 'record_seq', None, None, None, 'integer', None)
    (ID('mart15_foo'), 'sub1', None, 'Survey Subfield1', 'RIOS Instrument', 'text', None)
    datadictionary_enumeration: 2
    (ID(ID('mart14'), 'baz'), 'happy', 'Survey Happy')
    (ID(ID('mart14'), 'baz'), 'sad', 'Survey Sad')
    datadictionary_table: 4
    ('mart14', 'Survey Title', None)
    ('mart15', 'RexMart Testcase #15', None)
    ('mart15_bar', 'RexMart Testcase #15 (bar fields)', 'Survey Text for Bar')
    ('mart15_foo', 'RexMart Testcase #15 (foo fields)', 'Survey Text for Foo')
    mart14: 0
    mart15: 0
    mart15_bar: 0
    mart15_foo: 0
    >>> db_status(mart.name)
    Definition: form_metadata
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True
    >>> rex2.off()

    >>> rex2 = Rex('rex.mart_demo', mart_dictionary_presentation_priority=['sms'], mart_dictionary_channel_priority=['entry', 'survey', 'mobile', 'fakesms'], mart_hosting_cluster=cluster)
    >>> rex2.on()
    >>> mc = MartCreator('test', 'form_metadata')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['datadictionary_table', 'datadictionary_column', 'datadictionary_enumeration'])
    datadictionary_column: 14
    (ID('mart14'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart14'), 'bar', None, 'Mobile Text for Bar', 'RIOS Instrument', 'integer', None)
    (ID('mart14'), 'baz', None, 'Mobile Text for Baz', 'RIOS Instrument', 'enumeration', None)
    (ID('mart14'), 'foo', None, 'Mobile Text for Foo', 'RIOS Instrument', 'text', None)
    (ID('mart14'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart15'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'mart15_bar', None, None, None, 'facet', ID('mart15_bar'))
    (ID('mart15'), 'mart15_foo', None, None, None, 'branch', ID('mart15_foo'))
    (ID('mart15_bar'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_bar'), 'row1_col1', None, 'Entry Column1', 'RIOS Instrument', 'text', None)
    (ID('mart15_foo'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_foo'), 'record_seq', None, None, None, 'integer', None)
    (ID('mart15_foo'), 'sub1', None, 'Entry Subfield1', 'RIOS Instrument', 'text', None)
    datadictionary_enumeration: 2
    (ID(ID('mart14'), 'baz'), 'happy', 'Mobile Happy')
    (ID(ID('mart14'), 'baz'), 'sad', 'Mobile Sad')
    datadictionary_table: 4
    ('mart14', 'Survey Title', None)
    ('mart15', 'RexMart Testcase #15', None)
    ('mart15_bar', 'RexMart Testcase #15 (bar fields)', 'Entry Text for Bar')
    ('mart15_foo', 'RexMart Testcase #15 (foo fields)', 'Entry Text for Foo')
    mart14: 0
    mart15: 0
    mart15_bar: 0
    mart15_foo: 0
    >>> db_status(mart.name)
    Definition: form_metadata
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True
    >>> rex2.off()

    >>> rex2 = Rex('rex.mart_demo', mart_dictionary_presentation_priority=['sms', 'form'], mart_dictionary_channel_priority=['entry', 'survey', 'fakesms'], mart_hosting_cluster=cluster)
    >>> rex2.on()
    >>> mc = MartCreator('test', 'form_metadata')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['datadictionary_table', 'datadictionary_column', 'datadictionary_enumeration'])
    datadictionary_column: 14
    (ID('mart14'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart14'), 'bar', None, 'FakeSMS Text for Bar', 'RIOS Instrument', 'integer', None)
    (ID('mart14'), 'baz', None, 'FakeSMS Text for Baz', 'RIOS Instrument', 'enumeration', None)
    (ID('mart14'), 'foo', None, 'FakeSMS Text for Foo', 'RIOS Instrument', 'text', None)
    (ID('mart14'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'assessment_uid', 'Assessment UID', None, None, 'text', None)
    (ID('mart15'), 'instrument_version_uid', 'InstrumentVersion UID', None, None, 'text', None)
    (ID('mart15'), 'mart15_bar', None, None, None, 'facet', ID('mart15_bar'))
    (ID('mart15'), 'mart15_foo', None, None, None, 'branch', ID('mart15_foo'))
    (ID('mart15_bar'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_bar'), 'row1_col1', None, 'Entry Column1', 'RIOS Instrument', 'text', None)
    (ID('mart15_foo'), 'mart15', None, None, None, 'link', ID('mart15'))
    (ID('mart15_foo'), 'record_seq', None, None, None, 'integer', None)
    (ID('mart15_foo'), 'sub1', None, 'Entry Subfield1', 'RIOS Instrument', 'text', None)
    datadictionary_enumeration: 2
    (ID(ID('mart14'), 'baz'), 'happy', 'FakeSMS Happy')
    (ID(ID('mart14'), 'baz'), 'sad', 'FakeSMS Sad')
    datadictionary_table: 4
    ('mart14', 'Survey Title', None)
    ('mart15', 'RexMart Testcase #15', None)
    ('mart15_bar', 'RexMart Testcase #15 (bar fields)', 'Entry Text for Bar')
    ('mart15_foo', 'RexMart Testcase #15 (foo fields)', 'Entry Text for Foo')
    mart14: 0
    mart15: 0
    mart15_bar: 0
    mart15_foo: 0
    >>> db_status(mart.name)
    Definition: form_metadata
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True
    >>> rex2.off()

    >>> rex.on()


You can tell the creator to not mark the Mart as complete after processing is
done::

    >>> mc = MartCreator('test', 'some_data')
    >>> mart = mc(leave_incomplete=True)
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 5
    >>> db_status(mart.name)
    Definition: some_data
    Status: processing
    Owner: test
    Has Size: True
    Dates: True True

You can load Instruments/Assessments that have enumeration fields with hyphens
in their name::

    >>> mc = MartCreator('test', 'enum_values')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    mart13: 1
    >>> db_status(mart.name)
    Definition: enum_values
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Definitions can accept parameters that are passed to HTSQL/SQL statements::

    >>> mc = MartCreator('test', 'some_parameters')
    >>> mart = mc(parameters={'foo': 'blah', 'bar': 123})
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name, detailed=['foo', 'mart1'])
    foo: 12
    ('h1123', None)
    ('h1blah', None)
    ('h1test', None)
    ('h2123', None)
    ('h2blah', None)
    ('h2test', None)
    ('s1123', None)
    ('s1blah', None)
    ('s1some_parameters', None)
    ('s2123', None)
    ('s2blah', None)
    ('s2some_parameters', None)
    mart1: 8
    ('martassessment1', 'mart11', 'blah', 123, 'MARTASSESSMENT1-blah', 'foo1')
    ('martassessment2', 'mart11', 'blah', 123, 'MARTASSESSMENT2-blah', 'foo2')
    ('martassessment3', 'mart11', 'blah', 123, 'MARTASSESSMENT3-blah', 'foo3')
    ('martassessment4', 'mart11', 'blah', 123, 'MARTASSESSMENT4-blah', 'foo4')
    ('martassessment5', 'mart11', 'blah', 123, 'MARTASSESSMENT5-blah', 'foo5')
    ('martassessment6', 'mart11', 'blah', 123, 'MARTASSESSMENT6-blah', 'foo6')
    ('martassessment7', 'mart11', 'blah', 123, 'MARTASSESSMENT7-blah', 'foo7')
    ('martassessment8', 'mart11', 'blah', 123, 'MARTASSESSMENT8-blah', 'foo8')
    >>> db_status(mart.name)
    Definition: some_parameters
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mart = mc(parameters={'foo': 'blah'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Missing required parameter "bar"

    >>> mart = mc(parameters={'bar': 'blah'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Expected an integer
    Got:
        'blah'
    While validating parameter:
        bar

    >>> mart = mc(parameters={'bar': 123, 'baz': 'hello'})
    Traceback (most recent call last):
        ...
    rex.core.Error: Unknown parameters: baz

Your rex.deploy configuration can use include statements::

    >>> mc = MartCreator('test', 'just_deploy_includes')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    foo: 0
    >>> db_status(mart.name)
    Definition: just_deploy_includes
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

Your assessment configurations can specify inclusion of "all" instruments
without explicitly listing every one::

    >>> mc = MartCreator('test', 'all_assessments')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    alltypes: 5
    alltypes_matrix_field: 4
    alltypes_recordlist_field: 7
    calculation: 0
    calculation_complex: 1
    calculation_complex_q_matrix: 1
    calculation_complex_q_recordlist: 2
    complex: 0
    disabled: 1
    mart1: 8
    mart10: 0
    mart10_bar: 0
    mart11: 0
    mart11_bar: 0
    mart12: 1
    mart12_recordlist_field: 1
    mart13: 1
    mart14: 0
    mart15: 0
    mart15_bar: 0
    mart15_foo: 0
    mart2: 0
    mart3: 0
    mart4: 0
    mart4_bar: 0
    mart5: 0
    mart5_bar: 0
    mart6: 0
    mart7: 0
    mart8: 1
    mart9: 0
    mart9b: 0
    mart9b_baz: 0
    mart9b_blah: 0
    simple: 2
    texter: 0
    >>> db_status(mart.name)
    Definition: all_assessments
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mc = MartCreator('test', 'all_assessments_linked')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    alltypes: 5
    alltypes_matrix_field: 4
    alltypes_recordlist_field: 7
    calculation: 0
    calculation_complex: 1
    calculation_complex_q_matrix: 1
    calculation_complex_q_recordlist: 2
    complex: 0
    datadictionary_column: 244
    datadictionary_enumeration: 23
    datadictionary_table: 37
    disabled: 1
    mart1: 8
    mart10: 0
    mart10_bar: 0
    mart11: 0
    mart11_bar: 0
    mart12: 1
    mart12_recordlist_field: 1
    mart13: 1
    mart14: 0
    mart15: 0
    mart15_bar: 0
    mart15_foo: 0
    mart2: 0
    mart3: 0
    mart4: 0
    mart4_bar: 0
    mart5: 0
    mart5_bar: 0
    mart6: 0
    mart7: 0
    mart8: 1
    mart9: 0
    mart9b: 0
    mart9b_baz: 0
    mart9b_blah: 0
    simple: 2
    subject: 7
    texter: 0
    >>> db_status(mart.name)
    Definition: all_assessments_linked
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

You can get a::

    >>> mc = MartCreator('test', 'dynamic_simple')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    mart1: 8
    subject: 7
    >>> db_status(mart.name)
    Definition: dynamic_simple
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mc = MartCreator('test', 'dynamic_complex')
    >>> mart = mc()
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    mart1: 8
    mart2: 0
    subject: 7
    >>> db_status(mart.name)
    Definition: dynamic_complex
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

It complains if you don't specify an owner::

    >>> mc = MartCreator(None, 'some_data')
    Traceback (most recent call last):
        ...
    rex.core.Error: No owner specified

    >>> mc = MartCreator('', 'some_data')
    Traceback (most recent call last):
        ...
    rex.core.Error: No owner specified

It complains if you specify a definition that doesn't exist::

    >>> mc = MartCreator('test', 'doesntexist')
    Traceback (most recent call last):
        ...
    rex.core.Error: Unknown definition "doesntexist"

It complains if you try to copy a database that doesn't exist::

    >>> mc = MartCreator('test', 'just_copy_missing')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    rex.core.Error: Database "does_not_exist" does not exist
    While creating Mart database:
        just_copy_missing

It complains if you try to load into an existing database that doesn't exist::

    >>> mc = MartCreator('test', 'existing_missing')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    rex.core.Error: Database "a_db_that_doesnt_exist" does not exist
    While creating Mart database:
        existing_missing

It complains if you try to create a fixed-name Mart when someone else already
has a Mart with that name::

    >>> mc = MartCreator('test', 'fixed_name')
    >>> mart = mc()
    >>> mc = MartCreator('someoneelse', 'fixed_name')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    rex.core.Error: Cannot set name of Mart to "a_fixed_name_mart" because a Mart with that name already exists owned by "test"
    While purging previous fixed-name database
    While creating Mart database:
        fixed_name

It complains if an HTSQL statement is bad::

    >>> mc = MartCreator('test', 'broken_htsql')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    rex.core.Error: Found unknown attribute:
        people.first_name
    Perhaps you had in mind:
        firstname
    While translating:
                first_name :as col1
                ^^^^^^^^^^
    While executing statement:
        /people{
                first_name :as col1
            } :as foo
            /:rexdb
            /:insert
    While executing HTSQL script:
        #1
    While executing Post-Deployment Scripts
    While creating Mart database:
        broken_htsql

It complains if a SQL statement is bad::

    >>> mc = MartCreator('test', 'broken_sql')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    rex.core.Error: Got an error from the database driver:
        relation "blah" does not exist
        LINE 1: insert into blah (col1) values('stuff');
                            ^
    While executing SQL script:
        #1
    While executing Post-Deployment Scripts
    While creating Mart database:
        broken_sql



    >>> rex.off()


