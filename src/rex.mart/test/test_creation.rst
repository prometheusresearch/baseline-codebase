********
Creation
********


Set up the environment::

    >>> from rex.core import Rex
    >>> rex = Rex('rex.mart_demo')
    >>> rex.on()
    >>> from rex.mart import MartCreator, purge_mart

Some tools for testing::

    >>> from rex.mart import get_hosting_cluster, get_mart_db, get_management_db
    >>> def db_exists(name):
    ...     cluster = get_hosting_cluster()
    ...     return cluster.exists(name)
    >>> def db_inventory(name, detailed=False):
    ...     db = get_mart_db(name)
    ...     tables = db.produce('meta(/table)')
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
    ...     print 'Dates: %s %s' % (
    ...         bool(data[0].date_creation_started),
    ...         bool(data[0].date_creation_completed),
    ...     )

A simple, empty Mart::

    >>> mc = MartCreator('test', 'empty')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    No tables found
    >>> db_status(mc.name)
    Definition: empty
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Copy an existing DB::

    >>> mc = MartCreator('test', 'just_copy')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    assessment: 21
    channel: 5
    draftinstrumentversion: 2
    entry: 10
    instrument: 19
    instrumentversion: 21
    people: 5
    rexmart_inventory: 1
    subject: 7
    task: 7
    user: 2
    >>> db_status(mc.name)
    Definition: just_copy
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Make a table and transfer some data into it::

    >>> mc = MartCreator('test', 'some_data')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    foo: 5
    >>> db_status(mc.name)
    Definition: some_data
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Make a table and transfer some data into it with multiple scripts/statements::

    >>> mc = MartCreator('test', 'some_more_data')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    foo: 15
    >>> db_status(mc.name)
    Definition: some_more_data
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Make a table and load some data into it with SQL::

    >>> mc = MartCreator('test', 'some_sql_data')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    foo: 1
    >>> db_status(mc.name)
    Definition: some_sql_data
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Make a table and load some data into it with multiple SQL scripts/statements::

    >>> mc = MartCreator('test', 'some_more_sql_data')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    foo: 4
    >>> db_status(mc.name)
    Definition: some_more_sql_data
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Make a table and load it with data using both ETL phases::

    >>> mc = MartCreator('test', 'both_etl_phases')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    foo: 19
    >>> db_status(mc.name)
    Definition: both_etl_phases
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Make a table and load it with data using script parameters::

    >>> mc = MartCreator('test', 'some_data_with_params')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name, detailed=True)
    foo: 6
    (u'bar',)
    (u'baz',)
    (u'blah',)
    (u'foo',)
    (u'some_data_with_params',)
    (u'test',)
    >>> db_status(mc.name)
    Definition: some_data_with_params
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

Load data into an existing database::

    >>> mc = MartCreator('test', 'existing')
    >>> mart = mc()
    >>> mc.name
    'mart_demo'
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    assessment: 21
    channel: 5
    draftinstrumentversion: 2
    entry: 10
    foo: 5
    instrument: 19
    instrumentversion: 21
    people: 5
    rexmart_inventory: 1
    subject: 7
    task: 7
    user: 2
    >>> db_status(mc.name)
    Definition: existing
    Status: complete
    Owner: test
    Dates: True True

You can load Assessments into the Mart::

    >>> mc = MartCreator('test', 'simple_assessment')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    mart1: 8
    >>> db_status(mc.name)
    Definition: simple_assessment
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

You can load Assessments into the Mart and link the table to other tables in
the Mart::

    >>> mc = MartCreator('test', 'linked_assessment')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    mart1: 8
    subject: 5
    >>> db_status(mc.name)
    Definition: linked_assessment
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

    >>> mc = MartCreator('test', 'linked_assessment_alltypes')
    >>> mart = mc()
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    alltypes: 5
    alltypes_matrix_field: 4
    alltypes_recordlist_field: 7
    subject: 5
    >>> db_status(mc.name)
    Definition: linked_assessment_alltypes
    Status: complete
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)

You can tell the creator to not mark the Mart as complete after processing is
done::

    >>> mc = MartCreator('test', 'some_data')
    >>> mart = mc(leave_incomplete=True)
    >>> db_exists(mc.name)
    True
    >>> db_inventory(mc.name)
    foo: 5
    >>> db_status(mc.name)
    Definition: some_data
    Status: processing
    Owner: test
    Dates: True True
    >>> purge_mart(mc.code)


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
    >>> purge_mart(mc.code)

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
    >>> #purge_mart(mc.code)

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
    >>> purge_mart(mc.code)



    >>> rex.off()

