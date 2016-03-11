*************
REX.CTL Tasks
*************


Set up the environment::

    >>> from rex.ctl import ctl, Ctl
    >>> import os
    >>> os.environ['REX_PROJECT'] = 'rex.mart_demo'
    >>> os.environ['REX_PARAMETERS'] = '{"db": "pgsql:mart_demo"}'

    >>> def no_timestamp_ctl(cmd, input='', expect=0):
    ...     ctl = Ctl(cmd, input)
    ...     output = ctl.wait(expect=expect)
    ...     stripped_lines = [
    ...         line[27:] if not line.startswith('FATAL ERROR') else line
    ...         for line in output.splitlines()
    ...     ]
    ...     filtered_lines = []
    ...     i = 0
    ...     while i < len(stripped_lines):
    ...         if stripped_lines[i].startswith('  File "'):
    ...             i += 2
    ...             continue
    ...         filtered_lines.append(stripped_lines[i])
    ...         i += 1
    ...     print '\n'.join(filtered_lines)


mart-create
===========

The ``mart-create`` task allows you to create Mart databases from the
command line::

    >>> ctl('help mart-create')
    MART-CREATE - create Mart database(s)
    Usage: rex mart-create [<project>]
    <BLANKLINE>
    The mart-create task will create the specified Mart databases. You specify
    the Marts to create by either using a combination of the --owner and
    --definition options, or by using the --runlist option in combination with
    a RunList file.
    <BLANKLINE>
    When using the --owner/--definition option combination, this task will
    create a Mart for every unique combination of owners and definitions that
    were specified.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      -o/--owner=OWNER         : The owner to assign to the Mart. This option may be repeated to create Marts for multiple owners.
      -d/--definition=DEFINITION : The ID of the Definition to use when creating the Mart. This option may be repeated to create multiple types of Marts.
      -r/--runlist=RUNLIST     : The Mart RunList that details the batch creation of multiple Mart databases. If this option is specified, the --owner and --definition options cannot be used. To reference a runlist file that is embedded in a RexDB package, use the notation "some.package:/path/to/runlist.yaml"
      --halt-on-failure        : Indicates whether or not the failure to create a single Mart will cause the task to immediately stop. If not specified, the task will attempt to create all specified Marts, regardless of failures.
      --keep-on-failure        : Indicates whether or not the databases of failed Mart creations should be kept. If not specified, failed Marts will automatically have their databases deleted.
      --leave-incomplete       : Indicates whether or not to leave the status of Marts open. If not specified, Marts will automatically be marked as "complete", meaning they can be accessed by front-end users.
      -p/--param=PARAM=VALUE   : Sets a Mart creation parameter value.
    <BLANKLINE>

    >>> no_timestamp_ctl('mart-create --owner=foo --definition=some_data')  # doctest: +ELLIPSIS
    Starting Mart creation for owner=foo, definition=some_data
    Mart creation began: ...
    Creating database: mart_some_data_...
    Deploying structures...
    Executing Post-Deployment ETL...
    HTSQL script #1...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...

    >>> no_timestamp_ctl('mart-create --owner=foo --owner=bar --definition=some_data --definition=empty')  # doctest: +ELLIPSIS
    Starting Mart creation for owner=foo, definition=some_data
    Mart creation began: ...
    Creating database: mart_some_data_...
    Deploying structures...
    Executing Post-Deployment ETL...
    HTSQL script #1...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...
    Starting Mart creation for owner=foo, definition=empty
    Mart creation began: ...
    Creating database: mart_empty_...
    Executing Post-Deployment ETL...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...
    Starting Mart creation for owner=bar, definition=some_data
    Mart creation began: ...
    Creating database: mart_some_data_...
    Deploying structures...
    Executing Post-Deployment ETL...
    HTSQL script #1...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...
    Starting Mart creation for owner=bar, definition=empty
    Mart creation began: ...
    Creating database: mart_empty_...
    Executing Post-Deployment ETL...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...

    >>> no_timestamp_ctl('mart-create --owner=foo --definition=some_parameters --param=bar=42 --param=foo=hello')  # doctest: +ELLIPSIS
    Starting Mart creation for owner=foo, definition=some_parameters
    Mart creation began: ...
    Parameters: foo='hello', bar=42
    Creating database: mart_some_parameters_...
    Deploying structures...
    Executing Post-Deployment ETL...
    HTSQL script #1...
    SQL script #2...
    ...ETL complete
    Processing Assessment #1
    ...deploying structures
    ...loading Assessments
    ...8 Assessments loaded
    ...performing calculations
    ...complete
    Executing Post-Assessment ETL...
    HTSQL script #1...
    SQL script #2...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...

    >>> no_timestamp_ctl('mart-create --owner=foo --definition=some_parameters')  # doctest: +ELLIPSIS
    Starting Mart creation for owner=foo, definition=some_parameters
    Mart creation for Record(owner='foo', definition='some_parameters', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False, parameters={}) failed:
    Traceback (most recent call last):
    Error: Missing required parameter "bar"

    >>> no_timestamp_ctl('mart-create --runlist=./test/runlist1.yaml')  # doctest: +ELLIPSIS
    Starting Mart creation for owner=foo, definition=empty
    Mart creation began: ...
    Creating database: mart_empty_...
    Executing Post-Deployment ETL...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...
    Starting Mart creation for owner=foo, definition=broken_sql
    Mart creation began: ...
    Creating database: mart_broken_sql_...
    Deploying structures...
    Executing Post-Deployment ETL...
    SQL script #1...
    Mart creation for Record(owner='foo', definition='broken_sql', halt_on_failure=False, purge_on_failure=True, leave_incomplete=False, parameters={}) failed:
    Traceback (most recent call last):
    Error: Got an error from the database driver:
        relation "blah" does not exist
        LINE 1: insert into blah (col1) values('stuff');
                            ^
    While executing SQL script:
        #1
    While executing Post-Deployment Scripts
    While creating Mart database:
        broken_sql
    Starting Mart creation for owner=bar, definition=some_data
    Mart creation began: ...
    Creating database: mart_some_data_...
    Deploying structures...
    Executing Post-Deployment ETL...
    HTSQL script #1...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...

    >>> no_timestamp_ctl('mart-create --runlist=./test/runlist2.yaml', expect=1)  # doctest: +ELLIPSIS
    Starting Mart creation for owner=foo, definition=empty
    Mart creation began: ...
    Creating database: mart_empty_...
    Executing Post-Deployment ETL...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...
    Starting Mart creation for owner=foo, definition=broken_sql
    Mart creation began: ...
    Creating database: mart_broken_sql_...
    Deploying structures...
    Executing Post-Deployment ETL...
    SQL script #1...
    Mart creation for Record(owner='foo', definition='broken_sql', halt_on_failure=True, purge_on_failure=True, leave_incomplete=False, parameters={}) failed:
    Traceback (most recent call last):
    Error: Got an error from the database driver:
        relation "blah" does not exist
        LINE 1: insert into blah (col1) values('stuff');
                            ^
    While executing SQL script:
        #1
    While executing Post-Deployment Scripts
    While creating Mart database:
        broken_sql
    FATAL ERROR: Halting RunList due to creation error
    <BLANKLINE>

    >>> no_timestamp_ctl('mart-create --runlist=rex.mart_demo:/test_runlist.yaml')  # doctest: +ELLIPSIS
    Starting Mart creation for owner=foo, definition=empty
    Mart creation began: ...
    Creating database: mart_empty_...
    Executing Post-Deployment ETL...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...
    Starting Mart creation for owner=bar, definition=some_data
    Mart creation began: ...
    Creating database: mart_some_data_...
    Deploying structures...
    Executing Post-Deployment ETL...
    HTSQL script #1...
    ...ETL complete
    Executing Post-Assessment ETL...
    ...ETL complete
    Mart creation complete: ...
    Mart creation duration: ...
    Mart database size: ...

    >>> ctl('mart-create --runlist=./test/doesntexist.yaml', expect=1)  # doctest: +ELLIPSIS
    FATAL ERROR: Could not open "./test/doesntexist.yaml": [Errno 2] No such file or directory: './test/doesntexist.yaml'
    <BLANKLINE>

    >>> no_timestamp_ctl('mart-create --owner=foo --definition=just_deploy')  # doctest: +ELLIPSIS
    Skipping Mart creation for owner=foo, definition=just_deploy (owner not allowed to access definition)

    >>> ctl('mart-create', expect=1)  # doctest: +ELLIPSIS
    FATAL ERROR: You must specify at least one owner and definition
    <BLANKLINE>

    >>> ctl('mart-create --owner=foo', expect=1)  # doctest: +ELLIPSIS
    FATAL ERROR: You must specify at least one owner and definition
    <BLANKLINE>

    >>> ctl('mart-create --owner=foo --definition=bar', expect=1)  # doctest: +ELLIPSIS
    FATAL ERROR: "bar" is not a valid definition
    <BLANKLINE>

    >>> ctl('mart-create --owner=foo --runlist=bar', expect=1)  # doctest: +ELLIPSIS
    FATAL ERROR: Cannot specify both a runlist and owner/definition combinations
    <BLANKLINE>


mart-shell
==========

The ``mart-shell`` task opens an HTSQL console to the specified Mart database::

    >>> ctl('help mart-shell')
    MART-SHELL - open HTSQL shell to Mart database
    Usage: rex mart-shell [<project>] <code-name-owner>
    <BLANKLINE>
    The mart-shell task opens an HTSQL shell to the specified Mart database.
    <BLANKLINE>
    If the first argument to this task is an integer, then a connection is
    opened to the Mart whose ID/code is that integer.
    <BLANKLINE>
    If the first argument to this task is a string, then a connection is opened
    to the Mart whose database name is that string.
    <BLANKLINE>
    If you use the --reference option, the first argument will be treated as
    the owner, and the reference will specify which of their Marts to open.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      -r/--reference=REFERENCE : Specifies which of the owner's Mart databases to connect to. It must be in the form <DEFINITION_ID>@latest or <DEFINITION_ID>@<NUMBER>, where <NUMBER> is the index of the Marts of that Definition for the user (foo@1 would be the most recent foo Mart created, etc).
    <BLANKLINE>

    >>> ctl('mart-shell foo --reference=some_data@latest', input='/count(foo)')
     | count(foo) |
    -+------------+-
     |          5 |
    <BLANKLINE>

    >>> ctl('mart-shell foo --reference=some_data@2', input='/count(foo)')
     | count(foo) |
    -+------------+-
     |          5 |
    <BLANKLINE>

    >>> ctl('mart-shell foo --reference=some_data', input='/count(foo)', expect=1)
    FATAL ERROR: The reference must be in the form <DEFINITION>@latest or <DEFINITION>@<NUMBER>
    <BLANKLINE>

    >>> ctl('mart-shell foo --reference=some_data@blah', input='/count(foo)', expect=1)
    FATAL ERROR: The reference must be in the form <DEFINITION>@latest or <DEFINITION>@<NUMBER>
    <BLANKLINE>

    >>> ctl('mart-shell foo --reference=broken_sql@latest', input='/count(foo)', expect=1)
    FATAL ERROR: No matching Marts found
    <BLANKLINE>

    >>> ctl('mart-shell foo --reference=some_data@999', input='/count(foo)', expect=1)
    FATAL ERROR: No matching Marts found
    <BLANKLINE>


    >>> from rex.core import Rex
    >>> from rex.mart import MartAccessPermissions
    >>> with Rex('rex.mart_demo'):
    ...     marts = MartAccessPermissions.top().get_marts_for_user('foo', definition_id='some_data')

    >>> ctl('mart-shell %s' % (marts[0].code,), input='/count(foo)')
     | count(foo) |
    -+------------+-
     |          5 |
    <BLANKLINE>

    >>> ctl('mart-shell %s' % (str(marts[0].name),), input='/count(foo)')
     | count(foo) |
    -+------------+-
     |          5 |
    <BLANKLINE>

    >>> ctl('mart-shell doesntexist', input='/count(foo)', expect=1)
    FATAL ERROR: No Mart exists with code/name "doesntexist"
    <BLANKLINE>


mart-purge
==========

The ``mart-purge`` will delete the specified Mart(s) from the system::

    >>> ctl('help mart-purge')
    MART-PURGE - purge Mart database(s)
    Usage: rex mart-purge [<project>]
    <BLANKLINE>
    The mart-purge task will delete the specified Mart databases from the
    system.
    <BLANKLINE>
    You can specify the Mart(s) to purge using the --owner, --definition,
    --name, --code, and --all options. Using more than one option type will
    act as a logical AND operation when filtering the list of Marts. Using an
    option more than once will act as a logical OR operation between all values
    specified for that option.
    <BLANKLINE>
    Options:
      --require=PACKAGE        : include an additional parameter
      --set=PARAM=VALUE        : set a configuration parameter
      -o/--owner=OWNER         : The owner of the Mart(s) to purge. This option may be repeated to specify multiple owners.
      -d/--definition=DEFINITION : The Definition ID of the Mart(s) to purge. This option may be repeated to specify multiple Definitions.
      -n/--name=NAME           : The name of the Mart database(s) to purge. This option may be repeated to specify multiple databases.
      -c/--code=CODE           : The unique Code/ID of the Mart(s) to purge. This option may be repeated to specify multiple Marts.
      -a/--all                 : Indicates that ALL Marts in the system should be purged (regardless of any other criteria specified).
      -f/--force-accept        : Indicates that the Marts should be purged immediately without prompting the user for confirmation.
    <BLANKLINE>

    >>> ctl('mart-purge --owner=foo', input='N')  # doctest: +ELLIPSIS
    You are about to purge 6 Marts from the system:
      #...: mart_some_data_... (owner=foo, definition=some_data)
      #...: mart_some_data_... (owner=foo, definition=some_data)
      #...: mart_some_parameters_... (owner=foo, definition=some_parameters)
      #...: mart_empty_... (owner=foo, definition=empty)
      #...: mart_empty_... (owner=foo, definition=empty)
      #...: mart_empty_... (owner=foo, definition=empty)
    Are you sure you want to continue? (y/N): Purge aborted.

    >>> ctl('mart-purge --owner=foo --definition=some_data', input='N')  # doctest: +ELLIPSIS
    You are about to purge 2 Marts from the system:
      #...: mart_some_data_... (owner=foo, definition=some_data)
      #...: mart_some_data_... (owner=foo, definition=some_data)
    Are you sure you want to continue? (y/N): Purge aborted.

    >>> ctl('mart-purge --owner=foo --definition=some_data --force-accept')  # doctest: +ELLIPSIS
    You are about to purge 2 Marts from the system:
      #...: mart_some_data_... (owner=foo, definition=some_data)
      #...: mart_some_data_... (owner=foo, definition=some_data)
    Purging #...: mart_some_data_... (owner=foo, definition=some_data)...
    Purging #...: mart_some_data_... (owner=foo, definition=some_data)...
    Purge complete.

    >>> ctl('mart-purge --owner=foo --definition=some_data --force-accept')  # doctest: +ELLIPSIS
    No Marts found matching the specified criteria.

    >>> ctl('mart-purge --owner=foo --definition=empty', input='Y')  # doctest: +ELLIPSIS
    You are about to purge 3 Marts from the system:
      #...: mart_empty_... (owner=foo, definition=empty)
      #...: mart_empty_... (owner=foo, definition=empty)
      #...: mart_empty_... (owner=foo, definition=empty)
    Are you sure you want to continue? (y/N): Purging #...: mart_empty_... (owner=foo, definition=empty)...
    Purging #...: mart_empty_... (owner=foo, definition=empty)...
    Purging #...: mart_empty_... (owner=foo, definition=empty)...
    Purge complete.

    >>> ctl('mart-purge --name=doesntexist')
    No Marts found matching the specified criteria.

    >>> ctl('mart-purge --code=9999')
    No Marts found matching the specified criteria.

    >>> ctl('mart-purge', expect=1)
    FATAL ERROR: You must specify some selection criteria
    <BLANKLINE>




    >>> del os.environ['REX_PROJECT']
    >>> del os.environ['REX_PARAMETERS']

