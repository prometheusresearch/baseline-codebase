********
Creation
********


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()
    >>> from rex.mart import MartCreator

Some tools for testing::

    >>> from rex.mart import get_hosting_cluster, get_mart_db, get_management_db
    >>> def db_exists(name):
    ...     cluster = get_hosting_cluster()
    ...     return cluster.exists(name)
    >>> def db_inventory(name, detailed=False):
    ...     db = get_mart_db(name)
    ...     tables = db.produce("/meta(/table?name!={'rexmart_inventory','asynctask_queue'})")
    ...     if not tables:
    ...         print 'No tables found'
    ...         return
    ...     for table in tables:
    ...         cnt = db.produce('count(%s)' % (table[0],))
    ...         print '%s: %s' % (table[0], cnt.data)
    ...         if detailed:
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
    assessment: 22
    channel: 5
    draftinstrumentversion: 2
    entry: 10
    instrument: 19
    instrumentversion: 21
    people: 5
    subject: 7
    task: 7
    user: 2
    >>> db_status(mart.name)
    Definition: just_copy
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
    foo: 15
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
    foo: 19
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
    >>> db_inventory(mart.name, detailed=True)
    foo: 6
    (u'bar',)
    (u'baz',)
    (u'blah',)
    (u'foo',)
    (u'some_data_with_params',)
    (u'test',)
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
    assessment: 22
    channel: 5
    draftinstrumentversion: 2
    entry: 10
    foo: 5
    instrument: 19
    instrumentversion: 21
    people: 5
    subject: 7
    task: 7
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
    subject: 5
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
    subject: 5
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
    >>> db_inventory(mart.name, detailed=True)
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


It complains if you specify a definition that doesn't exist::

    >>> mc = MartCreator('test', 'doesntexist')
    Traceback (most recent call last):
        ...
    Error: Unknown definition "doesntexist"

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

