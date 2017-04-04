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
    ...     tables = db.produce("/meta(/table?name!={'rexmart_inventory','asynctask_queue'})")
    ...     if not tables:
    ...         print 'No tables found'
    ...         return
    ...     for table in tables:
    ...         cnt = db.produce('count(%s)' % (table[0],))
    ...         print '%s: %s' % (table[0], cnt.data)
    ...         if detailed and table[0] in detailed:
    ...             for rec in db.produce('/%s' % (table[0],)):
    ...                 print tuple(rec)
    >>> def db_status(name):
    ...     db = get_management_db()
    ...     data = db.produce('/rexmart_inventory?name=$name', name=name)
    ...     if not data:
    ...         print 'STATUS RECORD MISSING'
    ...     if len(data) > 1:
    ...         print 'MULTIPLE STATUS RECORDS FOUND'
    ...     print 'Definition: %s' % data[0].definition
    ...     print 'Status: %s' % data[0].status
    ...     print 'Owner: %s' % data[0].owner
    ...     print 'Has Size: %s' % (data[0].size > 0 if data[0].size is not None else False,)
    ...     print 'Dates: %s %s' % (
    ...         bool(data[0].date_creation_started),
    ...         bool(data[0].date_creation_completed),
    ...     )

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
    assessment: 25
    channel: 5
    draftform: 2
    draftinstrumentversion: 2
    entry: 10
    form: 8
    instrument: 24
    instrumentversion: 27
    interaction: 6
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
    assessment: 25
    channel: 5
    draftform: 2
    draftinstrumentversion: 2
    entry: 10
    form: 8
    instrument: 24
    instrumentversion: 27
    interaction: 6
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
    u'a_fixed_name_mart'
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
    u'a_fixed_name_mart'
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
    (u'bar', None)
    (u'baz', None)
    (u'blah', None)
    (u'foo', None)
    (u'some_data_with_params', None)
    (u'test', None)
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
    u'mart_demo'
    >>> db_exists(mart.name)
    True
    >>> db_inventory(mart.name)
    assessment: 25
    channel: 5
    draftform: 2
    draftinstrumentversion: 2
    entry: 10
    foo: 5
    form: 8
    instrument: 24
    instrumentversion: 27
    interaction: 6
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
    (u'martassessment1', u'mart11', u'MARTASSESSMENT1-1', u'MARTASSESSMENT1-2', u'MARTASSESSMENT1-3', u'foo1')
    (u'martassessment2', u'mart11', u'MARTASSESSMENT2-1', u'MARTASSESSMENT2-2', u'MARTASSESSMENT2-3', u'foo2')
    (u'martassessment3', u'mart11', u'MARTASSESSMENT3-1', u'MARTASSESSMENT3-2', u'MARTASSESSMENT3-3', u'foo3')
    (u'martassessment4', u'mart11', u'MARTASSESSMENT4-1', u'MARTASSESSMENT4-2', u'MARTASSESSMENT4-3', u'foo4')
    (u'martassessment5', u'mart11', u'MARTASSESSMENT5-1', u'MARTASSESSMENT5-2', u'MARTASSESSMENT5-3', u'foo5')
    (u'martassessment6', u'mart11', u'MARTASSESSMENT6-1', u'MARTASSESSMENT6-2', u'MARTASSESSMENT6-3', u'foo6')
    (u'martassessment7', u'mart11', u'MARTASSESSMENT7-1', u'MARTASSESSMENT7-2', u'MARTASSESSMENT7-3', u'foo7')
    (u'martassessment8', u'mart11', u'MARTASSESSMENT8-1', u'MARTASSESSMENT8-2', u'MARTASSESSMENT8-3', u'foo8')
    >>> db_status(mart.name)
    Definition: calculated_assessment
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
    (ID(u'foo'), u'col1', u'The First Column', None, None, u'text', None)
    (ID(u'foo'), u'col2', None, u'Test Description', None, u'enumeration', None)
    datadictionary_enumeration: 3
    (ID(ID(u'foo'), u'col2'), u'bar', None)
    (ID(ID(u'foo'), u'col2'), u'baz', u'Bazzerific Description')
    (ID(ID(u'foo'), u'col2'), u'foo', u'The FOO')
    datadictionary_table: 1
    (u'foo', u'Foo Bars', u'A Description')
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
    (ID(u'mart1'), u'assessment_uid', u'Assessment UID', u'the UID of the Assessment', None, u'code', None)
    (ID(u'mart1'), u'foo', None, u'The foo value', u'RIOS Instrument', u'text', None)
    (ID(u'mart1'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart1'), u'mycoolfield', u'My Cool Field', None, u'RexMart Calculation', u'text', None)
    (ID(u'mart1'), u'subject', None, None, u'RexMart Calculation', u'link', ID(u'subject'))
    (ID(u'subject'), u'mart1', None, None, None, u'branch', ID(u'mart1'))
    (ID(u'subject'), u'mobile_tn', u'Title Number 2', None, u'THE SOURCE', u'text', None)
    (ID(u'subject'), u'uid', None, None, None, u'text', None)
    datadictionary_enumeration: 0
    datadictionary_table: 2
    (u'mart1', u'RexMart Testcase #1', u'A description for the Instrument')
    (u'subject', None, u'CUSTOM SUBJECT DESCRIPTION!')
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
    (ID(u'alltypes'), u'alltypes_matrix_field', None, None, None, u'facet', ID(u'alltypes_matrix_field'))
    (ID(u'alltypes'), u'alltypes_recordlist_field', None, None, None, u'branch', ID(u'alltypes_recordlist_field'))
    (ID(u'alltypes'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'alltypes'), u'boolean_field', None, None, u'RIOS Instrument', u'boolean', None)
    (ID(u'alltypes'), u'calc1', None, u'A simple calculation', u'RIOS Calculation Set', u'integer', None)
    (ID(u'alltypes'), u'calc2', None, None, u'RIOS Calculation Set', u'text', None)
    (ID(u'alltypes'), u'date_field', None, None, u'RIOS Instrument', u'date', None)
    (ID(u'alltypes'), u'datetime_field', None, None, u'RIOS Instrument', u'datetime', None)
    (ID(u'alltypes'), u'enumeration_field', None, None, u'RIOS Instrument', u'enumeration', None)
    (ID(u'alltypes'), u'enumerationset_field_bar', None, u'An enumerated set (bar)', u'RIOS Instrument', u'boolean', None)
    (ID(u'alltypes'), u'enumerationset_field_baz', None, u'An enumerated set (baz)', u'RIOS Instrument', u'boolean', None)
    (ID(u'alltypes'), u'enumerationset_field_foo', None, u'An enumerated set (foo)', u'RIOS Instrument', u'boolean', None)
    (ID(u'alltypes'), u'float_field', None, None, u'RIOS Instrument', u'float', None)
    (ID(u'alltypes'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'alltypes'), u'integer_field', None, None, u'RIOS Instrument', u'integer', None)
    (ID(u'alltypes'), u'nullable_field', None, None, u'RIOS Instrument', u'text', None)
    (ID(u'alltypes'), u'text_field', None, u'This is a text field!', u'RIOS Instrument', u'text', None)
    (ID(u'alltypes'), u'time_field', None, None, u'RIOS Instrument', u'time', None)
    (ID(u'alltypes_matrix_field'), u'alltypes', None, None, None, u'link', ID(u'alltypes'))
    (ID(u'alltypes_matrix_field'), u'row1_col1', None, u'Just a col1 field', u'RIOS Instrument', u'text', None)
    (ID(u'alltypes_matrix_field'), u'row1_col2', None, None, u'RIOS Instrument', u'text', None)
    (ID(u'alltypes_matrix_field'), u'row2_col1', None, u'Just a col1 field', u'RIOS Instrument', u'text', None)
    (ID(u'alltypes_matrix_field'), u'row2_col2', None, None, u'RIOS Instrument', u'text', None)
    (ID(u'alltypes_recordlist_field'), u'alltypes', None, None, None, u'link', ID(u'alltypes'))
    (ID(u'alltypes_recordlist_field'), u'record_seq', None, None, None, u'integer', None)
    (ID(u'alltypes_recordlist_field'), u'subfield1', None, u'The sub field', u'RIOS Instrument', u'text', None)
    (ID(u'alltypes_recordlist_field'), u'subfield2', None, None, u'RIOS Instrument', u'text', None)
    datadictionary_enumeration: 3
    (ID(ID(u'alltypes'), u'enumeration_field'), u'bar', None)
    (ID(ID(u'alltypes'), u'enumeration_field'), u'baz', None)
    (ID(ID(u'alltypes'), u'enumeration_field'), u'foo', None)
    datadictionary_table: 3
    (u'alltypes', u'An Instrument With All Types', None)
    (u'alltypes_matrix_field', u'An Instrument With All Types (matrix_field fields)', None)
    (u'alltypes_recordlist_field', u'An Instrument With All Types (recordlist_field fields)', u'A list of records')
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
    (ID(u'mart14'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart14'), u'bar', None, u'Entry Text for Bar', u'RIOS Instrument', u'integer', None)
    (ID(u'mart14'), u'baz', None, u'Entry Text for Baz', u'RIOS Instrument', u'enumeration', None)
    (ID(u'mart14'), u'foo', None, u'Entry Text for Foo', u'RIOS Instrument', u'text', None)
    (ID(u'mart14'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart15'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'mart15_bar', None, None, None, u'facet', ID(u'mart15_bar'))
    (ID(u'mart15'), u'mart15_foo', None, None, None, u'branch', ID(u'mart15_foo'))
    (ID(u'mart15_bar'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_bar'), u'row1_col1', None, u'Entry Column1', u'RIOS Instrument', u'text', None)
    (ID(u'mart15_foo'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_foo'), u'record_seq', None, None, None, u'integer', None)
    (ID(u'mart15_foo'), u'sub1', None, u'Entry Subfield1', u'RIOS Instrument', u'text', None)
    datadictionary_enumeration: 2
    (ID(ID(u'mart14'), u'baz'), u'happy', u'Entry Happy')
    (ID(ID(u'mart14'), u'baz'), u'sad', u'Entry Sad')
    datadictionary_table: 4
    (u'mart14', u'Survey Title', None)
    (u'mart15', u'RexMart Testcase #15', None)
    (u'mart15_bar', u'RexMart Testcase #15 (bar fields)', u'Entry Text for Bar')
    (u'mart15_foo', u'RexMart Testcase #15 (foo fields)', u'Entry Text for Foo')
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
    (ID(u'mart14'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart14'), u'bar', None, u'Survey Text for Bar', u'RIOS Instrument', u'integer', None)
    (ID(u'mart14'), u'baz', None, u'Survey Text for Baz', u'RIOS Instrument', u'enumeration', None)
    (ID(u'mart14'), u'foo', None, u'Survey Text for Foo', u'RIOS Instrument', u'text', None)
    (ID(u'mart14'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart15'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'mart15_bar', None, None, None, u'facet', ID(u'mart15_bar'))
    (ID(u'mart15'), u'mart15_foo', None, None, None, u'branch', ID(u'mart15_foo'))
    (ID(u'mart15_bar'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_bar'), u'row1_col1', None, u'Survey Column1', u'RIOS Instrument', u'text', None)
    (ID(u'mart15_foo'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_foo'), u'record_seq', None, None, None, u'integer', None)
    (ID(u'mart15_foo'), u'sub1', None, u'Survey Subfield1', u'RIOS Instrument', u'text', None)
    datadictionary_enumeration: 2
    (ID(ID(u'mart14'), u'baz'), u'happy', u'Survey Happy')
    (ID(ID(u'mart14'), u'baz'), u'sad', u'Survey Sad')
    datadictionary_table: 4
    (u'mart14', u'Survey Title', None)
    (u'mart15', u'RexMart Testcase #15', None)
    (u'mart15_bar', u'RexMart Testcase #15 (bar fields)', u'Survey Text for Bar')
    (u'mart15_foo', u'RexMart Testcase #15 (foo fields)', u'Survey Text for Foo')
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
    (ID(u'mart14'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart14'), u'bar', None, u'Mobile Text for Bar', u'RIOS Instrument', u'integer', None)
    (ID(u'mart14'), u'baz', None, u'Mobile Text for Baz', u'RIOS Instrument', u'enumeration', None)
    (ID(u'mart14'), u'foo', None, u'Mobile Text for Foo', u'RIOS Instrument', u'text', None)
    (ID(u'mart14'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart15'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'mart15_bar', None, None, None, u'facet', ID(u'mart15_bar'))
    (ID(u'mart15'), u'mart15_foo', None, None, None, u'branch', ID(u'mart15_foo'))
    (ID(u'mart15_bar'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_bar'), u'row1_col1', None, u'Entry Column1', u'RIOS Instrument', u'text', None)
    (ID(u'mart15_foo'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_foo'), u'record_seq', None, None, None, u'integer', None)
    (ID(u'mart15_foo'), u'sub1', None, u'Entry Subfield1', u'RIOS Instrument', u'text', None)
    datadictionary_enumeration: 2
    (ID(ID(u'mart14'), u'baz'), u'happy', u'Mobile Happy')
    (ID(ID(u'mart14'), u'baz'), u'sad', u'Mobile Sad')
    datadictionary_table: 4
    (u'mart14', u'Survey Title', None)
    (u'mart15', u'RexMart Testcase #15', None)
    (u'mart15_bar', u'RexMart Testcase #15 (bar fields)', u'Entry Text for Bar')
    (u'mart15_foo', u'RexMart Testcase #15 (foo fields)', u'Entry Text for Foo')
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
    (ID(u'mart14'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart14'), u'bar', None, u'FakeSMS Text for Bar', u'RIOS Instrument', u'integer', None)
    (ID(u'mart14'), u'baz', None, u'FakeSMS Text for Baz', u'RIOS Instrument', u'enumeration', None)
    (ID(u'mart14'), u'foo', None, u'FakeSMS Text for Foo', u'RIOS Instrument', u'text', None)
    (ID(u'mart14'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'assessment_uid', u'Assessment UID', None, None, u'text', None)
    (ID(u'mart15'), u'instrument_version_uid', u'InstrumentVersion UID', None, None, u'text', None)
    (ID(u'mart15'), u'mart15_bar', None, None, None, u'facet', ID(u'mart15_bar'))
    (ID(u'mart15'), u'mart15_foo', None, None, None, u'branch', ID(u'mart15_foo'))
    (ID(u'mart15_bar'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_bar'), u'row1_col1', None, u'Entry Column1', u'RIOS Instrument', u'text', None)
    (ID(u'mart15_foo'), u'mart15', None, None, None, u'link', ID(u'mart15'))
    (ID(u'mart15_foo'), u'record_seq', None, None, None, u'integer', None)
    (ID(u'mart15_foo'), u'sub1', None, u'Entry Subfield1', u'RIOS Instrument', u'text', None)
    datadictionary_enumeration: 2
    (ID(ID(u'mart14'), u'baz'), u'happy', u'FakeSMS Happy')
    (ID(ID(u'mart14'), u'baz'), u'sad', u'FakeSMS Sad')
    datadictionary_table: 4
    (u'mart14', u'Survey Title', None)
    (u'mart15', u'RexMart Testcase #15', None)
    (u'mart15_bar', u'RexMart Testcase #15 (bar fields)', u'Entry Text for Bar')
    (u'mart15_foo', u'RexMart Testcase #15 (foo fields)', u'Entry Text for Foo')
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
    (u'h1123', None)
    (u'h1blah', None)
    (u'h1test', None)
    (u'h2123', None)
    (u'h2blah', None)
    (u'h2test', None)
    (u's1123', None)
    (u's1blah', None)
    (u's1some_parameters', None)
    (u's2123', None)
    (u's2blah', None)
    (u's2some_parameters', None)
    mart1: 8
    (u'martassessment1', u'mart11', u'blah', 123L, u'MARTASSESSMENT1-blah', u'foo1')
    (u'martassessment2', u'mart11', u'blah', 123L, u'MARTASSESSMENT2-blah', u'foo2')
    (u'martassessment3', u'mart11', u'blah', 123L, u'MARTASSESSMENT3-blah', u'foo3')
    (u'martassessment4', u'mart11', u'blah', 123L, u'MARTASSESSMENT4-blah', u'foo4')
    (u'martassessment5', u'mart11', u'blah', 123L, u'MARTASSESSMENT5-blah', u'foo5')
    (u'martassessment6', u'mart11', u'blah', 123L, u'MARTASSESSMENT6-blah', u'foo6')
    (u'martassessment7', u'mart11', u'blah', 123L, u'MARTASSESSMENT7-blah', u'foo7')
    (u'martassessment8', u'mart11', u'blah', 123L, u'MARTASSESSMENT8-blah', u'foo8')
    >>> db_status(mart.name)
    Definition: some_parameters
    Status: complete
    Owner: test
    Has Size: True
    Dates: True True

    >>> mart = mc(parameters={'foo': 'blah'})
    Traceback (most recent call last):
        ...
    Error: Missing required parameter "bar"

    >>> mart = mc(parameters={'bar': 'blah'})
    Traceback (most recent call last):
        ...
    Error: Expected an integer
    Got:
        'blah'
    While validating parameter:
        bar

    >>> mart = mc(parameters={'bar': 123, 'baz': 'hello'})
    Traceback (most recent call last):
        ...
    Error: Unknown parameters: baz

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


It complains if you don't specify an owner::

    >>> mc = MartCreator(None, 'some_data')
    Traceback (most recent call last):
        ...
    Error: No owner specified

    >>> mc = MartCreator('', 'some_data')
    Traceback (most recent call last):
        ...
    Error: No owner specified

It complains if you specify a definition that doesn't exist::

    >>> mc = MartCreator('test', 'doesntexist')
    Traceback (most recent call last):
        ...
    Error: Unknown definition "doesntexist"

It complains if you try to copy a database that doesn't exist::

    >>> mc = MartCreator('test', 'just_copy_missing')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    Error: Database "does_not_exist" does not exist
    While creating Mart database:
        just_copy_missing

It complains if you try to load into an existing database that doesn't exist::

    >>> mc = MartCreator('test', 'existing_missing')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    Error: Database "a_db_that_doesnt_exist" does not exist
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
    Error: Cannot set name of Mart to "a_fixed_name_mart" because a Mart with that name already exists owned by "test"
    While purging previous fixed-name database
    While creating Mart database:
        fixed_name

It complains if an HTSQL statement is bad::

    >>> mc = MartCreator('test', 'broken_htsql')
    >>> mart = mc()
    Traceback (most recent call last):
        ...
    Error: Found unknown attribute:
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
    Error: Got an error from the database driver:
        relation "blah" does not exist
        LINE 1: insert into blah (col1) values('stuff');
                            ^
    While executing SQL script:
        #1
    While executing Post-Deployment Scripts
    While creating Mart database:
        broken_sql



    >>> rex.off()

