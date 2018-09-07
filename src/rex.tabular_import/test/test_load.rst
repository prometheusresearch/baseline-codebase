*******
Loading
*******


Set up the environment::

    >>> from contextlib import contextmanager
    >>> from rex.core import Rex, get_packages
    >>> from rex.db import get_db
    >>> rex = Rex('rex.tabular_import_demo')
    >>> from rex.tabular_import.marshal import FILE_FORMAT_CSV
    >>> from rex.tabular_import.error import *
    >>> from rex.tabular_import.load import *
    >>> rex.on()
    >>> db = get_db()

    >>> def print_query(query):
    ...     print(b"".join(db.emit('text/plain', db.produce(query))).decode('utf-8'))
    >>> def purge_table(table):
    ...     db.produce('/%s{id()}/:delete' % table)


import_tabular_data
===================

The import_tabular_data() function will load a data file into the specified
table::

    >>> TEST_CSV = get_packages().open('rex.tabular_import_demo:/data/all_column_types.csv', 'rb').read()
    >>> purge_table('all_column_types')
    >>> print_query('/all_column_types')
     | All Column Types                                                                                                                              |
     +---------------+---------------+---------------+-------------+------------+------------+------------+----------------+------------+------------+
     | Integer Field | Boolean Field | Decimal Field | Float Field | Text Field | Date Field | Time Field | Datetime Field | Json Field | Enum Field |
    -+---------------+---------------+---------------+-------------+------------+------------+------------+----------------+------------+------------+-
    <BLANKLINE>
    <BLANKLINE>

    >>> import_tabular_data('all_column_types', TEST_CSV, FILE_FORMAT_CSV)
    1

    >>> print_query('/all_column_types')
     | All Column Types                                                                                                                                   |
     +---------------+---------------+---------------+-------------+------------+------------+------------+---------------------+------------+------------+
     | Integer Field | Boolean Field | Decimal Field | Float Field | Text Field | Date Field | Time Field | Datetime Field      | Json Field | Enum Field |
    -+---------------+---------------+---------------+-------------+------------+------------+------------+---------------------+------------+------------+-
     |             1 | true          |           1.2 |       1.234 | foobar     | 1980-05-22 | 12:34:56   | 1980-05-22 12:34:56 | {          | baz        |
     :               :               :               :             :            :            :            :                     :   "foo": 1 :            :
     :               :               :               :             :            :            :            :                     : }          :            :
    <BLANKLINE>
    <BLANKLINE>

If you specify a non-existant table, it will complain::

    >>> import_tabular_data('doesntexist', TEST_CSV, FILE_FORMAT_CSV)
    Traceback (most recent call last):
        ...
    ValueError: No table named "doesntexist" exists

If you specify a bogus file format, it will complain::

    >>> import_tabular_data('all_column_types', TEST_CSV, 'PDF')
    Traceback (most recent call last):
        ...
    ValueError: "PDF" is not a supported file format

If the input data is missing columns, it will complain::

    >>> TEST_MISSING_CSV = get_packages().open('rex.tabular_import_demo:/data/all_column_types_missing.csv', 'rb').read()
    >>> import_tabular_data('all_column_types', TEST_MISSING_CSV, FILE_FORMAT_CSV)
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Incoming dataset is missing columns: enum_field, json_field

If the input data has extra columns, it will complain::

    >>> TEST_EXTRA_CSV = get_packages().open('rex.tabular_import_demo:/data/all_column_types_extra.csv', 'rb').read()
    >>> import_tabular_data('all_column_types', TEST_EXTRA_CSV, FILE_FORMAT_CSV)
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Incoming dataset describes extra columns: foo_bar

If the input data has duplicated columns, it will complain::

    >>> TEST_DUPE_CSV = get_packages().open('rex.tabular_import_demo:/data/all_column_types_duplicate.csv', 'rb').read()
    >>> import_tabular_data('all_column_types', TEST_DUPE_CSV, FILE_FORMAT_CSV)
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Incoming dataset has duplicate column headers

If the input data has jagged record sizes (some/all records are missing or have
extra columns, it will complain::

    >>> TEST_JAGGED_CSV = get_packages().open('rex.tabular_import_demo:/data/all_column_types_jagged.csv', 'rb').read()
    >>> import_tabular_data('all_column_types', TEST_JAGGED_CSV, FILE_FORMAT_CSV)
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Errors occurred while importing the records
        1: Incorrect number of columns

If the fields contain data that cannot be cast to the appropriate datatype,
it will complain::

    >>> TEST_BADFORMAT_CSV = get_packages().open('rex.tabular_import_demo:/data/all_column_types_badformats.csv', 'rb').read()

    >>> purge_table('all_column_types')
    >>> print_query('/all_column_types')
     | All Column Types                                                                                                                              |
     +---------------+---------------+---------------+-------------+------------+------------+------------+----------------+------------+------------+
     | Integer Field | Boolean Field | Decimal Field | Float Field | Text Field | Date Field | Time Field | Datetime Field | Json Field | Enum Field |
    -+---------------+---------------+---------------+-------------+------------+------------+------------+----------------+------------+------------+-
    <BLANKLINE>
    <BLANKLINE>

    >>> import_tabular_data('all_column_types', TEST_BADFORMAT_CSV, FILE_FORMAT_CSV)
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Errors occurred while importing the records
        2: Failed to adapt value of enum_field to enum('foo', 'bar', 'baz'): 'blah'
        3: Failed to adapt value of json_field to json: '{'
        4: Failed to adapt value of datetime_field to datetime: '1980-05-22 noon'
        5: Failed to adapt value of time_field to time: 'noon'
        6: Failed to adapt value of date_field to date: 'May the Twenty-Second'
        7: Failed to adapt value of float_field to float: 'float'
        8: Failed to adapt value of decimal_field to decimal: 'decimal'
        9: Failed to adapt value of boolean_field to boolean: 'happy'
        10: Failed to adapt value of integer_field to integer: 'integer'

    >>> print_query('/all_column_types')
     | All Column Types                                                                                                                              |
     +---------------+---------------+---------------+-------------+------------+------------+------------+----------------+------------+------------+
     | Integer Field | Boolean Field | Decimal Field | Float Field | Text Field | Date Field | Time Field | Datetime Field | Json Field | Enum Field |
    -+---------------+---------------+---------------+-------------+------------+------------+------------+----------------+------------+------------+-
    <BLANKLINE>
    <BLANKLINE>

When inserting empty values into fields with default values, the default
behavior is to follow the input file strictly and insert NULL values into the
fields::

    >>> TEST_REQUIRED_CSV = get_packages().open('rex.tabular_import_demo:/data/required_tests.csv', 'rb').read()
    >>> purge_table('required_tests')
    >>> print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
    <BLANKLINE>
    <BLANKLINE>

    >>> import_tabular_data('required_tests', TEST_REQUIRED_CSV, FILE_FORMAT_CSV)
    3

    >>> with db:
    ...     print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
     |    1 | foo         |              | bar                      |                           |
     |    2 | foo         | baz          | bar                      | blah                      |
     |  123 | foo         | baz          | bar                      | blah                      |
    <BLANKLINE>
    <BLANKLINE>

But, if the ``use_defaults`` option is enabled, the default values will instead
be stored::

    >>> purge_table('required_tests')
    >>> print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
    <BLANKLINE>
    <BLANKLINE>

    >>> import_tabular_data('required_tests', TEST_REQUIRED_CSV, FILE_FORMAT_CSV, use_defaults=True)
    3

    >>> print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
     |    1 | foo         |              | bar                      | foo                       |
     |    2 | foo         | baz          | bar                      | blah                      |
     |  123 | foo         | baz          | bar                      | blah                      |
    <BLANKLINE>
    <BLANKLINE>

When inserting empty values into required fields, it will complain::

    >>> TEST_REQMISSING_CSV = get_packages().open('rex.tabular_import_demo:/data/required_tests_missing.csv', 'rb').read()
    >>> purge_table('required_tests')
    >>> print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
    <BLANKLINE>
    <BLANKLINE>

    >>> import_tabular_data('required_tests', TEST_REQMISSING_CSV, FILE_FORMAT_CSV)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Errors occurred while importing the records
        1: Got ... from the database driver: null value in column "is_required" violates not-null constraint
    DETAIL:  Failing row contains (7, 1, null, null, bar, null).
        2: Got ... from the database driver: null value in column "is_required_with_default" violates not-null constraint
    DETAIL:  Failing row contains (8, 1, foo, null, null, null).

    >>> print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
    <BLANKLINE>
    <BLANKLINE>

When inserting empty values into required fields when the ``use_defaults``
option is enabled, it will only complain about situations where the field does
not have a default value::

    >>> purge_table('required_tests')
    >>> print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
    <BLANKLINE>
    <BLANKLINE>

    >>> import_tabular_data('required_tests', TEST_REQMISSING_CSV, FILE_FORMAT_CSV, use_defaults=True)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Errors occurred while importing the records
        1: Got ... from the database driver: null value in column "is_required" violates not-null constraint
    DETAIL:  Failing row contains (9, 1, null, null, bar, foo).

    >>> print_query('/required_tests')
     | Required Tests                                                                           |
     +------+-------------+--------------+--------------------------+---------------------------+
     | Code | Is Required | Not Required | Is Required With Default | Not Required With Default |
    -+------+-------------+--------------+--------------------------+---------------------------+-
    <BLANKLINE>
    <BLANKLINE>

When inserting non-unique values into unique-constrained fields, it will
complain::

    >>> TEST_UNIQUE_CSV = get_packages().open('rex.tabular_import_demo:/data/unique_tests.csv', 'rb').read()
    >>> purge_table('unique_tests')
    >>> import_tabular_data('unique_tests', TEST_UNIQUE_CSV, FILE_FORMAT_CSV)
    1
    >>> print_query('/unique_tests')
     | Unique Tests                  |
     +------+-----------+------------+
     | Code | Is Unique | Not Unique |
    -+------+-----------+------------+-
     |    1 | foo       | bar        |
    <BLANKLINE>
    <BLANKLINE>

    >>> TEST_UNIQUE_BAD_CSV = get_packages().open('rex.tabular_import_demo:/data/unique_tests_bad.csv', 'rb').read()
    >>> import_tabular_data('unique_tests', TEST_UNIQUE_BAD_CSV, FILE_FORMAT_CSV)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Errors occurred while importing the records
        1: Got ... from the database driver: duplicate key value violates unique constraint "unique_tests__pk"
    DETAIL:  Key (code)=(1) already exists.
        2: Got ... from the database driver: duplicate key value violates unique constraint "unique_tests__is_unique__uk"
    DETAIL:  Key (is_unique)=(foo) already exists.

    >>> print_query('/unique_tests')
     | Unique Tests                  |
     +------+-----------+------------+
     | Code | Is Unique | Not Unique |
    -+------+-----------+------------+-
     |    1 | foo       | bar        |
    <BLANKLINE>
    <BLANKLINE>


blah::

    >>> TEST_TRUNK_CSV = get_packages().open('rex.tabular_import_demo:/data/trunk.csv', 'rb').read()
    >>> purge_table('trunk')
    >>> import_tabular_data('trunk', TEST_TRUNK_CSV, FILE_FORMAT_CSV)
    2
    >>> print_query('/trunk')
     | Trunk          |
     +------+---------+
     | Code | A Field |
    -+------+---------+-
     |    1 | foo     |
     |    2 | bar     |
    <BLANKLINE>
    <BLANKLINE>

    >>> TEST_BRANCH_CSV = get_packages().open('rex.tabular_import_demo:/data/branch.csv', 'rb').read()
    >>> purge_table('branch')
    >>> import_tabular_data('branch', TEST_BRANCH_CSV, FILE_FORMAT_CSV)
    3
    >>> print_query('/branch')
     | Branch                    |
     +-------+------+------------+
     | Trunk | Code | Some Field |
    -+-------+------+------------+-
     | 1     |    1 | true       |
     | 1     |    2 | false      |
     | 2     |    5 | true       |
    <BLANKLINE>
    <BLANKLINE>

    >>> TEST_BRANCHBAD_CSV = get_packages().open('rex.tabular_import_demo:/data/branch_badlink.csv', 'rb').read()
    >>> import_tabular_data('branch', TEST_BRANCHBAD_CSV, FILE_FORMAT_CSV)
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Errors occurred while importing the records
        1: Unable to resolve a link: trunk[3]
    >>> print_query('/branch')
     | Branch                    |
     +-------+------+------------+
     | Trunk | Code | Some Field |
    -+-------+------+------------+-
     | 1     |    1 | true       |
     | 1     |    2 | false      |
     | 2     |    5 | true       |
    <BLANKLINE>
    <BLANKLINE>

    >>> TEST_BRANCHBADUNIQ_CSV = get_packages().open('rex.tabular_import_demo:/data/branch_nonunique.csv', 'rb').read()
    >>> import_tabular_data('branch', TEST_BRANCHBADUNIQ_CSV, FILE_FORMAT_CSV)  # doctest: +ELLIPSIS
    Traceback (most recent call last):
        ...
    rex.tabular_import.error.TabularImportError: Errors occurred while importing the records
        1: Got ... from the database driver: duplicate key value violates unique constraint "branch_pk"
    DETAIL:  Key (trunk_id, code)=(1, 1) already exists.
        2: Got ... from the database driver: duplicate key value violates unique constraint "branch_pk"
    DETAIL:  Key (trunk_id, code)=(1, 1) already exists.

    >>> print_query('/branch')
     | Branch                    |
     +-------+------+------------+
     | Trunk | Code | Some Field |
    -+-------+------+------------+-
     | 1     |    1 | true       |
     | 1     |    2 | false      |
     | 2     |    5 | true       |
    <BLANKLINE>
    <BLANKLINE>



    >>> rex.off()


